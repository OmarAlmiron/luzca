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

export async function sendMail({ to, subject, html }) {
  // Si no hay credenciales SMTP configuradas (modo demo), solo lo logueamos.
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL SIMULADO] Para: ${to} | Asunto: ${subject}`);
    return { simulated: true };
  }
  const info = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM || 'Luzca <no-reply@luzca.com.ar>',
    to,
    subject,
    html,
  });
  return info;
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
