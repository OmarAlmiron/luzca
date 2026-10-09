// Cotizador de envíos.
// Hoy calcula por zonas (provincia + código postal) con tarifas propias.
// Más adelante se puede reemplazar quoteShipping() por la API de un correo
// (Correo Argentino MiCorreo, Andreani, etc.) sin tocar el resto del código.
//
// AJUSTÁ ESTOS VALORES a lo que te cobra tu correo (son de referencia).

export const PROVINCES = [
  'Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const ZONES = {
  AMBA: { label: 'CABA y GBA', cost: 4500, days: '1 a 3 días hábiles' },
  BSAS: { label: 'Interior de Buenos Aires', cost: 6500, days: '3 a 5 días hábiles' },
  CENTRO: { label: 'Región Centro', cost: 7500, days: '3 a 6 días hábiles' },
  NORTE_CUYO: { label: 'Norte y Cuyo', cost: 8900, days: '4 a 8 días hábiles' },
  PATAGONIA: { label: 'Patagonia', cost: 10900, days: '5 a 9 días hábiles' },
  TDF: { label: 'Tierra del Fuego', cost: 12900, days: '6 a 10 días hábiles' },
};

const PROVINCE_ZONE = {
  'Ciudad Autónoma de Buenos Aires': 'AMBA',
  'Córdoba': 'CENTRO', 'Santa Fe': 'CENTRO', 'Entre Ríos': 'CENTRO', 'La Pampa': 'CENTRO',
  'Neuquén': 'PATAGONIA', 'Río Negro': 'PATAGONIA', 'Chubut': 'PATAGONIA', 'Santa Cruz': 'PATAGONIA',
  'Tierra del Fuego': 'TDF',
};

export const FREE_SHIPPING_FROM = Number(process.env.FREE_SHIPPING_FROM || 80000);

// Acepta "1043" o el CPA "C1043AAB"
export function normalizeZip(zip = '') {
  const m = String(zip).toUpperCase().match(/^[A-Z]?(\d{4})[A-Z]{0,3}$/);
  return m ? m[1] : null;
}

export function quoteShipping({ province, zip, subtotal = 0 }) {
  if (!PROVINCES.includes(province)) {
    throw Object.assign(new Error('Elegí una provincia válida'), { status: 400 });
  }
  const cp = normalizeZip(zip);
  if (!cp) throw Object.assign(new Error('Código postal inválido (ej: 1043 o C1043AAB)'), { status: 400 });

  let zoneKey = PROVINCE_ZONE[province];
  if (!zoneKey && province === 'Buenos Aires') {
    // Conurbano: CP 1600-1999 => AMBA, el resto interior de la provincia
    zoneKey = Number(cp) >= 1600 && Number(cp) <= 1999 ? 'AMBA' : 'BSAS';
  }
  if (!zoneKey) zoneKey = 'NORTE_CUYO';

  const zone = ZONES[zoneKey];
  const free = subtotal >= FREE_SHIPPING_FROM;
  return {
    zone: zoneKey,
    zoneLabel: zone.label,
    cost: free ? 0 : zone.cost,
    baseCost: zone.cost,
    free,
    freeFrom: FREE_SHIPPING_FROM,
    eta: zone.days,
    carrier: 'Envío a domicilio',
  };
}
