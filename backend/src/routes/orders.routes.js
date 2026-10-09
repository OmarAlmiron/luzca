import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { quoteShipping } from '../utils/shipping.js';
import { addressSchema, formatAddress } from '../utils/validation.js';

const router = Router();

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
});

router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = orderSchema.parse(req.body);
    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
    });

    let subtotal = 0;
    const itemsData = data.items.map((it) => {
      const product = products.find((p) => p.id === it.productId);
      if (!product) throw Object.assign(new Error('Producto inválido en el carrito'), { status: 400 });
      if (product.stock < it.quantity) {
        throw Object.assign(new Error(`No hay stock suficiente de "${product.name}" (quedan ${product.stock})`), { status: 400 });
      }
      subtotal += product.price * it.quantity;
      return { productId: product.id, quantity: it.quantity, price: product.price };
    });

    // El costo de envío SIEMPRE se calcula en el servidor (no se confía en el front)
    const quote = quoteShipping({ province: data.address.province, zip: data.address.zip, subtotal });
    const shippingCost = quote.cost;
    const total = subtotal + shippingCost;

    const u = req.user;
    const shippingData = {
      recipient: u.name,
      dni: u.dni,
      phone: u.phone,
      email: u.email,
      ...data.address,
      zone: quote.zoneLabel,
      eta: quote.eta,
    };

    const order = await prisma.order.create({
      data: {
        userId: u.id,
        subtotal,
        shippingCost,
        total,
        shippingAddr: formatAddress(data.address),
        shippingData,
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } } },
    });

    // Si el usuario cargó una dirección nueva, se la guardamos para la próxima
    if (data.saveAddress) {
      const exists = await prisma.address.findFirst({
        where: { userId: u.id, street: data.address.street, number: data.address.number, zip: data.address.zip },
      });
      if (!exists) {
        const count = await prisma.address.count({ where: { userId: u.id } });
        await prisma.address.create({ data: { ...data.address, userId: u.id, isDefault: count === 0 } });
      }
    }

    // El mail de confirmación se manda recién cuando Mercado Pago aprueba el pago (webhook)
    res.status(201).json(order);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
