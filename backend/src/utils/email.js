import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

// Envío de mails.
// Prioridad: 1) Resend (API HTTP, funciona en Railway Hobby, que bloquea los puertos SMTP)
//            2) SMTP (solo si el hosting lo permite)
//            3) Modo demo: solo se loguea
export async function sendMail({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || 'Luzca <no-reply@luzca.com.ar>';

  if (process.env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Resend ${res.status}: ${body.message || JSON.stringify(body)}`);
    console.log(`[EMAIL] Enviado por Resend a ${to} | ${subject}`);
    return body;
  }

  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Asunto: ${subject}`);
    return { simulated: true };
  }

  const info = await getTransporter().sendMail({ from, to, subject, html });
  console.log(`[EMAIL] Enviado por SMTP a ${to} | ${subject}`);
  return info;
}

// Aviso al dueño de la tienda cada vez que entra una venta pagada
export function newSaleTemplate(order) {
  const items = (order.items || [])
    .map((it) => `<li>${it.product?.name || it.productId} x${it.quantity} — $${(it.price * it.quantity).toLocaleString('es-AR')}</li>`)
    .join('');
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#8a5a2b">Nueva venta 🎉 — $${order.total.toLocaleString('es-AR')}</h2>
    <p><strong>Pedido:</strong> #${order.id}</p>
    <p><strong>Cliente:</strong> ${order.user?.name || ''} (${order.user?.email || ''})</p>
    <p><strong>Envío a:</strong> ${order.shippingAddr}</p>
    <ul>${items}</ul>
    <p><strong>Pago MP:</strong> ${order.paymentId || '-'}</p>
  </div>`;
}

export function orderConfirmationTemplate(order, user) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#8a5a2b">¡Gracias por tu compra, ${user.name}!</h2>
    <p>Tu pedido <strong>#${order.id}</strong> fue confirmado.</p>
    <p><strong>Total:</strong> $${order.total.toLocaleString('es-AR')}</p>
    <p>Te avisaremos por este medio cuando tu pedido sea despachado, junto con el código de seguimiento.</p>
    <p style="color:#888;font-size:12px">Luzca · Iluminación y diseño para tu casa</p>
  </div>`;
}

export function shippingUpdateTemplate(order) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#8a5a2b">Tu pedido está en camino 🚚</h2>
    <p>Pedido <strong>#${order.id}</strong> — código de seguimiento: <strong>${order.trackingCode || 'N/A'}</strong></p>
  </div>`;
}

export function contactAckTemplate(name) {
  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
    <h2 style="color:#8a5a2b">Recibimos tu mensaje, ${name}</h2>
    <p>Nuestro equipo de atención al cliente te va a responder dentro de las próximas 24hs hábiles.</p>
  </div>`;
}
