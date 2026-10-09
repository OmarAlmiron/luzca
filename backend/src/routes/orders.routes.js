import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { getShippingOptions } from '../utils/shipping.js';
import { loadCartItems } from './shipping.routes.js';
import { addressSchema, formatAddress } from '../utils/validation.js';

const router = Router();

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  address: addressSchema,
  saveAddress: z.boolean().optional(),
  shippingOptionId: z.string().max(80).optional(),
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
    const cart = await loadCartItems(data.items);

    let subtotal = 0;
    const itemsData = cart.map(({ quantity, product }) => {
      if (product.stock < quantity) {
        throw Object.assign(new Error(`No hay stock suficiente de "${product.name}" (quedan ${product.stock})`), { status: 400 });
      }
      subtotal += product.price * quantity;
      return { productId: product.id, quantity, price: product.price };
    });

    // El envío SIEMPRE se recalcula en el servidor; el front solo elige la opción
    const { options } = await getShippingOptions({ province: data.address.province, zip: data.address.zip, city: data.address.city, items: cart });
    const option = options.find((o) => o.id === data.shippingOptionId) || options[0];
    const shippingCost = option.cost;
    const total = subtotal + shippingCost;

    const u = req.user;
    const shippingData = {
      recipient: u.name,
      dni: u.dni,
      phone: u.phone,
      email: u.email,
      ...data.address,
      shippingOptionId: option.id,
      carrier: option.carrier,
      service: option.service,
      deliveryType: option.deliveryType,
      zone: option.zoneLabel,
      provider: option.provider || 'zonas',
      zipnova: option.zipnova || null,
      eta: option.eta,
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
