import prisma from '../config/db.js';
import { createZipnovaShipment, zipnovaEnabled } from './zipnova.js';

// Crea el envío en el proveedor (hoy Zipnova) y guarda el seguimiento en el pedido.
// No cambia el estado a "enviado": eso se marca cuando el paquete se despacha.
export async function createShipmentForOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true, items: { include: { product: true } } },
  });
  if (!order) throw Object.assign(new Error('Pedido no encontrado'), { status: 404 });
  if (order.externalShipmentId) return order; // ya creado
  if (order.shippingData?.provider !== 'zipnova') {
    throw Object.assign(new Error('Este pedido no se cotizó con Zipnova; despachalo manualmente'), { status: 400 });
  }
  try {
    const s = await createZipnovaShipment(order);
    return prisma.order.update({ where: { id: orderId }, data: { ...s, shipmentError: null } });
  } catch (err) {
    await prisma.order.update({ where: { id: orderId }, data: { shipmentError: err.message.slice(0, 500) } });
    throw err;
  }
}

// Se llama cuando un pago se aprueba: si está activado, crea el envío sin intervención
export function autoCreateShipment(orderId) {
  if (process.env.ZIPNOVA_AUTO_CREATE !== 'true' || !zipnovaEnabled()) return;
  createShipmentForOrder(orderId)
    .then((o) => console.log(`[envios] Envío creado para ${orderId}: ${o.carrier} ${o.trackingCode}`))
    .catch((e) => console.error(`[envios] No se pudo crear el envío de ${orderId}:`, e.message));
}
