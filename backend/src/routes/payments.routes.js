import { Router } from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { createPreference, getPayment } from '../utils/mercadopago.js';
import { sendMail, orderConfirmationTemplate } from '../utils/email.js';

const router = Router();

// Crea la preferencia de pago de Mercado Pago para un pedido existente
router.post('/create-preference/:orderId', requireAuth, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.orderId },
      include: { items: { include: { product: true } } },
    });
    if (!order || order.userId !== req.user.id) return res.status(404).json({ error: 'Pedido no encontrado' });

    const items = order.items.map((it) => ({
      name: it.product.name,
      quantity: it.quantity,
      price: it.price,
    }));

    const pref = await createPreference({
      order,
      items,
      backUrls: {
        success: `${process.env.CLIENT_URL}/checkout/exito`,
        failure: `${process.env.CLIENT_URL}/checkout/error`,
        pending: `${process.env.CLIENT_URL}/checkout/pendiente`,
      },
    });

    res.json({ id: pref.id, initPoint: pref.init_point, sandboxInitPoint: pref.sandbox_init_point });
  } catch (err) {
    next(err);
  }
});

// Webhook de Mercado Pago: confirma pagos automáticamente
router.post('/webhook', async (req, res) => {
  try {
    const paymentId = req.query['data.id'] || req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const payment = await getPayment(paymentId);
    const orderId = payment.external_reference;
    if (!orderId) return res.sendStatus(200);

    if (payment.status === 'approved') {
      const order = await prisma.order.update({
        where: { id: orderId },
        data: { status: 'paid', paymentId: String(paymentId) },
        include: { user: true },
      });
      sendMail({
        to: order.user.email,
        subject: `Pago aprobado — Pedido #${order.id}`,
        html: orderConfirmationTemplate(order, order.user),
      }).catch((e) => console.error(e.message));
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook MP error:', err.message);
    res.sendStatus(200); // Siempre 200 para que MP no reintente indefinidamente
  }
});

export default router;
