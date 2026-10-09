// Integración con Zipnova Envíos (agregador: Andreani, Correo Argentino, OCA, etc.)
// Docs: https://docs.zipnova.com/envios/
//
// Variables en Railway:
//   SHIPPING_PROVIDER=zipnova
//   ZIPNOVA_API_TOKEN / ZIPNOVA_API_SECRET   (Configuración > Integraciones > Gestionar credenciales)
//   ZIPNOVA_ACCOUNT_ID                        (ID de tu cuenta en Zipnova)
//   ZIPNOVA_ORIGIN_ID                         (opcional: ID de tu dirección de origen; si no, usa la por defecto)
//   ZIPNOVA_AUTO_CREATE=true                  (crear el envío automáticamente cuando se aprueba el pago)

const BASE = process.env.ZIPNOVA_API_URL || 'https://api.zipnova.com.ar/v2';

export const zipnovaEnabled = () =>
  !!(process.env.ZIPNOVA_API_TOKEN && process.env.ZIPNOVA_API_SECRET && process.env.ZIPNOVA_ACCOUNT_ID);

async function zn(path, body) {
  const auth = Buffer.from(`${process.env.ZIPNOVA_API_TOKEN}:${process.env.ZIPNOVA_API_SECRET}`).toString('base64');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data.message || data.error || JSON.stringify(data.errors || data).slice(0, 300);
      throw Object.assign(new Error(`Zipnova ${res.status}: ${msg}`), { status: res.status, data });
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Zipnova reconoce las provincias por nombre; CABA suele figurar como "Capital Federal"
const stateName = (province) => (province === 'Ciudad Autónoma de Buenos Aires' ? 'Capital Federal' : province);

// Un ítem por unidad (Zipnova arma la caja con type_packaging "dynamic")
function toItems(items) {
  const out = [];
  for (const { quantity, product: p } of items) {
    for (let i = 0; i < quantity; i += 1) {
      out.push({
        sku: p.slug || p.id,
        description: p.name.slice(0, 60),
        weight: Math.max(10, p.weightGrams || 1500),
        height: p.heightCm || 30,
        width: p.widthCm || 30,
        length: p.lengthCm || 30,
      });
    }
  }
  return out;
}

// Duración ISO 8601 ("P3D", "P1DT12H") -> días hábiles aprox.
function isoDays(d) {
  if (!d) return null;
  const m = String(d).match(/P(?:(\d+)D)?(?:T(?:(\d+)H)?)?/);
  if (!m) return null;
  return Math.max(1, Math.ceil(Number(m[1] || 0) + Number(m[2] || 0) / 24));
}

function etaText(dt) {
  const min = isoDays(dt?.times?.total?.min) ?? dt?.min;
  const max = isoDays(dt?.times?.total?.max) ?? dt?.max;
  if (min && max && min !== max) return `${min} a ${max} días hábiles`;
  if (max || min) return `${max || min} días hábiles`;
  if (dt?.estimated_delivery) return `aprox. el ${new Date(dt.estimated_delivery).toLocaleDateString('es-AR')}`;
  return 'según el correo';
}

// Proveedor de cotización para utils/shipping.js
export async function zipnovaProvider({ province, zip, city, pkg, items }) {
  if (!zipnovaEnabled()) throw new Error('Zipnova sin credenciales');
  const body = {
    account_id: Number(process.env.ZIPNOVA_ACCOUNT_ID),
    source: 'luzca.com.ar',
    declared_value: Math.round(pkg.declaredValue),
    destination: { city: city || undefined, state: stateName(province), zipcode: zip },
    items: toItems(items),
    type_packaging: 'dynamic',
    sort_by: 'price',
  };
  if (process.env.ZIPNOVA_ORIGIN_ID) body.origin_id = Number(process.env.ZIPNOVA_ORIGIN_ID);

  const data = await zn('/shipments/quote', body);
  const results = Object.values(data.results || {}).filter((r) => r && r.selectable !== false);

  return results
    // Retiro en punto (pickup_point) requiere elegir el punto en el checkout: por ahora solo domicilio
    .filter((r) => r.service_type?.code !== 'pickup_point')
    .map((r) => ({
      id: `zn-${r.carrier?.id}-${r.service_type?.code}-${r.logistic_type}`,
      carrier: r.carrier?.name || 'Correo',
      service: r.service_type?.name || 'Envío a domicilio',
      deliveryType: 'D',
      cost: Math.round(Number(r.amounts?.price_incl_tax ?? r.amounts?.price ?? 0)),
      eta: etaText(r.delivery_time),
      provider: 'zipnova',
      zipnova: { carrier_id: r.carrier?.id, service_type: r.service_type?.code, logistic_type: r.logistic_type },
    }));
}

// Crea el envío en Zipnova para un pedido pagado. Devuelve los datos de seguimiento.
// order: con user, items (con product) y shippingData (snapshot del checkout)
export async function createZipnovaShipment(order) {
  if (!zipnovaEnabled()) throw new Error('Zipnova sin credenciales');
  const d = order.shippingData || {};
  if (!d.zipnova) throw new Error('El pedido no se cotizó con Zipnova');

  const body = {
    account_id: Number(process.env.ZIPNOVA_ACCOUNT_ID),
    origin_id: process.env.ZIPNOVA_ORIGIN_ID || 'auto',
    external_id: order.id.slice(0, 30),
    source: 'luzca.com.ar',
    declared_value: Math.round(order.subtotal),
    service_type: d.zipnova.service_type,
    logistic_type: d.zipnova.logistic_type,
    carrier_id: d.zipnova.carrier_id,
    type_packaging: 'dynamic',
    destination: {
      name: d.recipient || order.user?.name,
      document: d.dni || order.user?.dni,
      email: d.email || order.user?.email,
      phone: d.phone || order.user?.phone,
      street: d.apartment ? `${d.street} (${d.apartment})` : d.street,
      street_number: d.number,
      city: d.city,
      state: stateName(d.province),
      zipcode: String(d.zip).replace(/\D/g, '').slice(0, 4),
    },
    items: toItems(order.items.map((it) => ({ quantity: it.quantity, product: it.product }))),
  };

  const s = await zn('/shipments', body);
  return {
    externalShipmentId: String(s.id),
    carrier: s.carrier?.name || d.carrier,
    trackingCode: s.carrier_tracking_id || s.delivery_id || String(s.id),
    trackingUrl: s.tracking || s.tracking_external || null,
  };
}
