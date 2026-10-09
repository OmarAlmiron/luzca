import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { sendMail, shippingUpdateTemplate, orderDeliveredTemplate } from '../utils/email.js';
import { createShipmentForOrder } from '../utils/fulfillment.js';

const router = Router();
router.use(requireAuth, requireAdmin);

const STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

// Resumen para la portada del panel
router.get('/stats', async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [byStatus, revenue, lowStock, openWithdrawals, customers] = await Promise.all([
      prisma.order.groupBy({ by: ['status'], _count: true }),
      prisma.order.aggregate({
        where: { status: { in: ['paid', 'shipped', 'delivered'] }, createdAt: { gte: since } },
        _sum: { total: true }, _count: true,
      }),
      prisma.product.count({ where: { active: true, stock: { lte: 3 } } }),
      prisma.withdrawalRequest.count({ where: { status: 'open' } }),
      prisma.user.count({ where: { role: 'customer' } }),
    ]);
    res.json({
      ordersByStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      revenue30d: revenue._sum.total || 0,
      sales30d: revenue._count,
      lowStock,
      openWithdrawals,
      customers,
    });
  } catch (err) { next(err); }
});

// Pedidos: filtro por estado y búsqueda por id / email / nombre
router.get('/orders', async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const where = {};
    if (status && STATUSES.includes(status)) where.status = status;
    if (q) {
      where.OR = [
        { id: { endsWith: String(q).toLowerCase() } },
        { user: { email: { contains: String(q), mode: 'insensitive' } } },
        { user: { name: { contains: String(q), mode: 'insensitive' } } },
      ];
    }
    const orders = await prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true, dni: true } }, items: { include: { product: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    res.json(orders);
  } catch (err) { next(err); }
});

const orderUpdateSchema = z.object({
  status: z.enum(STATUSES).optional(),
  carrier: z.string().max(60).optional(),
  trackingCode: z.string().max(80).optional(),
  trackingUrl: z.string().url().max(300).optional().or(z.literal('')),
  adminNotes: z.string().max(1000).optional(),
  notify: z.boolean().optional(), // mandar mail al cliente
});

router.patch('/orders/:id', async (req, res, next) => {
  try {
    const data = orderUpdateSchema.parse(req.body);
    const { notify = true, ...fields } = data;
    const current = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!current) return res.status(404).json({ error: 'Pedido no encontrado' });

    if (fields.status === 'shipped' && !(fields.trackingCode || current.trackingCode)) {
      return res.status(400).json({ error: 'Cargá el código de seguimiento para marcarlo como enviado' });
    }
    if (fields.status === 'shipped' && current.status !== 'shipped') fields.shippedAt = new Date();
    if (fields.trackingUrl === '') fields.trackingUrl = null;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: fields,
      include: {
        user: { select: { name: true, firstName: true, email: true, phone: true, dni: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    });

    if (notify && fields.status && fields.status !== current.status) {
      const mail =
        fields.status === 'shipped' ? { subject: `Tu pedido #${order.id.slice(-8).toUpperCase()} está en camino`, html: shippingUpdateTemplate(order) } :
        fields.status === 'delivered' ? { subject: `Tu pedido #${order.id.slice(-8).toUpperCase()} fue entregado`, html: orderDeliveredTemplate(order) } :
        null;
      if (mail) sendMail({ to: order.user.email, ...mail }).catch((e) => console.error('Error mail estado:', e.message));
    }
    res.json(order);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// Crear (o reintentar) el envío en Zipnova para un pedido pagado
router.post('/orders/:id/create-shipment', async (req, res, next) => {
  try {
    const o = await createShipmentForOrder(req.params.id);
    res.json({ ok: true, carrier: o.carrier, trackingCode: o.trackingCode, trackingUrl: o.trackingUrl, externalShipmentId: o.externalShipmentId });
  } catch (err) {
    if (err.status && err.status < 500) return res.status(err.status === 401 || err.status === 403 ? 502 : err.status).json({ error: err.message });
    res.status(502).json({ error: err.message });
  }
});

// Productos: listado completo (incluye inactivos) y edición rápida
router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
    res.json(products.map((p) => ({ ...p, images: JSON.parse(p.images) })));
  } catch (err) { next(err); }
});

const productUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  price: z.number().positive().optional(),
  compareAt: z.number().positive().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
  description: z.string().max(5000).optional(),
  weightGrams: z.number().int().min(1).max(50000).optional(),
  lengthCm: z.number().int().min(1).max(200).optional(),
  widthCm: z.number().int().min(1).max(200).optional(),
  heightCm: z.number().int().min(1).max(200).optional(),
});

router.patch('/products/:id', async (req, res, next) => {
  try {
    const data = productUpdateSchema.parse(req.body);
    const p = await prisma.product.update({ where: { id: req.params.id }, data, include: { category: true } });
    res.json({ ...p, images: JSON.parse(p.images) });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    next(err);
  }
});

// Arrepentimientos
router.get('/withdrawals', async (req, res, next) => {
  try {
    res.json(await prisma.withdrawalRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  } catch (err) { next(err); }
});

router.patch('/withdrawals/:id', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['open', 'done', 'rejected']) }).parse(req.body);
    res.json(await prisma.withdrawalRequest.update({ where: { id: req.params.id }, data: { status } }));
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Estado inválido' });
    next(err);
  }
});

// Mensajes de contacto
router.get('/messages', async (req, res, next) => {
  try {
    res.json(await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  } catch (err) { next(err); }
});

router.patch('/messages/:id', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.enum(['open', 'answered']) }).parse(req.body);
    res.json(await prisma.contactMessage.update({ where: { id: req.params.id }, data: { status } }));
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Estado inválido' });
    next(err);
  }
});

export default router;
