import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { sendMail, orderConfirmationTemplate } from '../utils/email.js';

const router = Router();

const orderSchema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
  shippingAddr: z.string().min(5),
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
      subtotal += product.price * it.quantity;
      return { productId: product.id, quantity: it.quantity, price: product.price };
    });

    const shippingCost = subtotal > 80000 ? 0 : 4500;
    const total = subtotal + shippingCost;

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        subtotal,
        shippingCost,
        total,
        shippingAddr: data.shippingAddr,
        items: { create: itemsData },
      },
      include: { items: { include: { product: true } } },
    });

    sendMail({
      to: req.user.email,
      subject: `Confirmación de pedido #${order.id}`,
      html: orderConfirmationTemplate(order, req.user),
    }).catch((e) => console.error('Error enviando email:', e.message));

    res.status(201).json(order);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
