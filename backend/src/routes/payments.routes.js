import { Router } from 'express';
import crypto from 'crypto';
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

    // CLIENT_URL puede tener varios dominios separados por coma (para CORS);
    // para las URLs de retorno de Mercado Pago usamos siempre el primero (el dominio principal).
    const primaryUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

    const pref = await createPreference({
      order,
      items,
      backUrls: {
        success: `${primaryUrl}/checkout/exito`,
        failure: `${primaryUrl}/checkout/error`,
        pending: `${primaryUrl}/checkout/pendiente`,
      },
    });

    res.json({ id: pref.id, initPoint: pref.init_point, sandboxInitPoint: pref.sandbox_init_point });
  } catch (err) {
    next(err);
  }
});

// Valida que la notificación realmente venga de Mercado Pago (firma HMAC-SHA256)
// Documentación: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/additional-content/notifications/webhooks
function isValidSignature(req) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Si todavía no cargaste la clave, no bloqueamos (modo desarrollo)

  const xSignature = req.headers['x-signature'];
  const xRequestId = req.headers['x-request-id'];
  const dataId = req.query['data.id'];
  if (!xSignature || !xRequestId || !dataId) return false;

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.trim().split('=').map((s) => s.trim())),
  );
  const { ts, v1 } = parts;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return expected === v1;
}

// Webhook de Mercado Pago: confirma pagos automáticamente
router.post('/webhook', async (req, res) => {
  try {
    if (!isValidSignature(req)) {
      console.warn('Webhook MP: firma inválida, se ignora la notificación');
      return res.sendStatus(200);
    }

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