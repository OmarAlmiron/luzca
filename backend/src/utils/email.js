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

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;
const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function itemsTable(order) {
  const rows = (order.items || []).map((it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee">${esc(it.product?.name || it.productId)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(it.price * it.quantity)}</td>
      </tr>`).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr style="color:#888;text-align:left"><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Importe</th></tr>
      ${rows}
      <tr><td colspan="2" style="padding-top:10px">Subtotal</td><td style="padding-top:10px;text-align:right">${money(order.subtotal)}</td></tr>
      <tr><td colspan="2">Envío</td><td style="text-align:right">${order.shippingCost ? money(order.shippingCost) : 'Gratis'}</td></tr>
      <tr><td colspan="2"><strong>Total</strong></td><td style="text-align:right"><strong>${money(order.total)}</strong></td></tr>
    </table>`;
}

function shippingBlock(order) {
  const d = order.shippingData || {};
  return `
    <p style="margin:4px 0"><strong>Recibe:</strong> ${esc(d.recipient || order.user?.name)} — DNI ${esc(d.dni || '-')}</p>
    <p style="margin:4px 0"><strong>Teléfono:</strong> ${esc(d.phone || order.user?.phone || '-')}</p>
    <p style="margin:4px 0"><strong>Dirección:</strong> ${esc(order.shippingAddr)}</p>
    ${d.notes ? `<p style="margin:4px 0"><strong>Referencias:</strong> ${esc(d.notes)}</p>` : ''}
    ${d.eta ? `<p style="margin:4px 0"><strong>Entrega estimada:</strong> ${esc(d.eta)} desde el despacho</p>` : ''}`;
}

const wrap = (inner) => `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#2b2118">
    <h1 style="font-family:Georgia,serif;color:#8a5a2b;margin-bottom:4px">Luzca</h1>
    ${inner}
    <p style="color:#888;font-size:12px;margin-top:32px">Luzca · Iluminación y diseño para tu casa · luzca.com.ar</p>
  </div>`;

// Mail al comprador cuando el pago se aprueba
export function orderConfirmationTemplate(order, user) {
  return wrap(`
    <h2>¡Gracias por tu compra, ${esc(user.firstName || user.name)}!</h2>
    <p>Recibimos el pago de tu pedido <strong>#${order.id.slice(-8).toUpperCase()}</strong>. Ya lo estamos preparando.</p>
    <h3 style="margin-top:24px">Detalle</h3>
    ${itemsTable(order)}
    <h3 style="margin-top:24px">Envío</h3>
    ${shippingBlock(order)}
    <p style="margin-top:24px">Te vamos a avisar por mail cuando lo despachemos, con el código de seguimiento.
    Podés ver el estado en <a href="https://luzca.com.ar/panel">Mi cuenta</a>.</p>
    <p>¿Alguna duda? Respondé este mail o escribinos desde <a href="https://luzca.com.ar/contacto">luzca.com.ar/contacto</a>.</p>`);
}

// Aviso al dueño de la tienda: todo lo necesario para preparar y despachar
export function newSaleTemplate(order) {
  const u = order.user || {};
  return wrap(`
    <h2>Nueva venta — ${money(order.total)}</h2>
    <p><strong>Pedido:</strong> #${order.id.slice(-8).toUpperCase()} <span style="color:#888">(${order.id})</span><br>
       <strong>Pago Mercado Pago:</strong> ${esc(order.paymentId || '-')}</p>
    <h3>Cliente</h3>
    <p style="margin:4px 0">${esc(u.name)} — ${esc(u.email)}</p>
    <h3>Despachar a</h3>
    ${shippingBlock(order)}
    <h3>Productos</h3>
    ${itemsTable(order)}
    <p style="margin-top:24px"><strong>Próximo paso:</strong> preparar el paquete, despacharlo y cargar el código de seguimiento.</p>`);
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
