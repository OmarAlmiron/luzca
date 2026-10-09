// Envíos: arma el paquete a partir de los productos y devuelve las opciones de envío.
//
// Proveedores (variable SHIPPING_PROVIDER en Railway):
//   - "zonas" (por defecto): tarifas propias por provincia/CP (tabla de abajo).
//   - más adelante: un agregador o correo con API (Zipnova, Andreani, Correo Argentino).
// Si el proveedor externo falla, se usa la tabla de zonas para no frenar ventas.

export const PROVINCES = [
  'Ciudad Autónoma de Buenos Aires', 'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba',
  'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

// Códigos ISO 3166-2:AR (los usan las APIs de los correos)
export const PROVINCE_CODES = {
  'Ciudad Autónoma de Buenos Aires': 'C', 'Buenos Aires': 'B', Catamarca: 'K', Chaco: 'H', Chubut: 'U',
  'Córdoba': 'X', Corrientes: 'W', 'Entre Ríos': 'E', Formosa: 'P', Jujuy: 'Y', 'La Pampa': 'L',
  'La Rioja': 'F', Mendoza: 'M', Misiones: 'N', 'Neuquén': 'Q', 'Río Negro': 'R', Salta: 'A',
  'San Juan': 'J', 'San Luis': 'D', 'Santa Cruz': 'Z', 'Santa Fe': 'S', 'Santiago del Estero': 'G',
  'Tierra del Fuego': 'V', 'Tucumán': 'T',
};

export const FREE_SHIPPING_FROM = Number(process.env.FREE_SHIPPING_FROM || 80000);
export const ORIGIN_ZIP = process.env.SHIPPING_ORIGIN_ZIP || '1414';

// Acepta "1043" o el CPA "C1043AAB"
export function normalizeZip(zip = '') {
  const m = String(zip).toUpperCase().trim().match(/^[A-Z]?(\d{4})[A-Z]{0,3}$/);
  return m ? m[1] : null;
}

// Arma un paquete único: suma pesos, apila alturas y toma el largo/ancho mayor.
// items: [{ quantity, product: { price, weightGrams, lengthCm, widthCm, heightCm } }]
export function buildPackage(items) {
  let weightGrams = 0; let lengthCm = 0; let widthCm = 0; let heightCm = 0; let declaredValue = 0;
  for (const { quantity, product: p } of items) {
    weightGrams += (p.weightGrams || 1500) * quantity;
    lengthCm = Math.max(lengthCm, p.lengthCm || 30);
    widthCm = Math.max(widthCm, p.widthCm || 30);
    heightCm += (p.heightCm || 30) * quantity;
    declaredValue += p.price * quantity;
  }
  return { weightGrams, lengthCm, widthCm, heightCm: Math.min(heightCm, 150), declaredValue };
}

// ---------- Proveedor "zonas": tarifas propias ----------
// AJUSTÁ ESTOS VALORES a lo que te cobra tu correo. "extraKg" se suma por cada kg arriba de 5 kg.
const ZONES = {
  AMBA: { label: 'CABA y GBA', cost: 4500, extraKg: 400, days: '1 a 3 días hábiles' },
  BSAS: { label: 'Interior de Buenos Aires', cost: 6500, extraKg: 600, days: '3 a 5 días hábiles' },
  CENTRO: { label: 'Región Centro', cost: 7500, extraKg: 700, days: '3 a 6 días hábiles' },
  NORTE_CUYO: { label: 'Norte y Cuyo', cost: 8900, extraKg: 850, days: '4 a 8 días hábiles' },
  PATAGONIA: { label: 'Patagonia', cost: 10900, extraKg: 1000, days: '5 a 9 días hábiles' },
  TDF: { label: 'Tierra del Fuego', cost: 12900, extraKg: 1200, days: '6 a 10 días hábiles' },
};
const PROVINCE_ZONE = {
  'Ciudad Autónoma de Buenos Aires': 'AMBA',
  'Córdoba': 'CENTRO', 'Santa Fe': 'CENTRO', 'Entre Ríos': 'CENTRO', 'La Pampa': 'CENTRO',
  'Neuquén': 'PATAGONIA', 'Río Negro': 'PATAGONIA', 'Chubut': 'PATAGONIA', 'Santa Cruz': 'PATAGONIA',
  'Tierra del Fuego': 'TDF',
};

function zonesProvider({ province, zip, pkg }) {
  let key = PROVINCE_ZONE[province];
  if (!key && province === 'Buenos Aires') key = Number(zip) >= 1600 && Number(zip) <= 1999 ? 'AMBA' : 'BSAS';
  if (!key) key = 'NORTE_CUYO';
  const z = ZONES[key];
  const extraKg = Math.max(0, Math.ceil((pkg.weightGrams - 5000) / 1000));
  return [{
    id: `zonas-${key.toLowerCase()}`,
    carrier: 'Luzca Envíos',
    service: 'Envío a domicilio',
    deliveryType: 'D',
    zoneLabel: z.label,
    cost: z.cost + extraKg * z.extraKg,
    eta: z.days,
  }];
}

const PROVIDERS = {
  zonas: zonesProvider,
  // zipnova: zipnovaProvider,   // se agrega al tener las credenciales
};

// Devuelve las opciones de envío ordenadas de menor a mayor precio
export async function getShippingOptions({ province, zip, items }) {
  if (!PROVINCES.includes(province)) throw Object.assign(new Error('Elegí una provincia válida'), { status: 400 });
  const cp = normalizeZip(zip);
  if (!cp) throw Object.assign(new Error('Código postal inválido (ej: 1043 o C1043AAB)'), { status: 400 });
  if (!items?.length) throw Object.assign(new Error('El carrito está vacío'), { status: 400 });

  const pkg = buildPackage(items);
  const subtotal = pkg.declaredValue;
  const providerName = process.env.SHIPPING_PROVIDER || 'zonas';
  const provider = PROVIDERS[providerName] || zonesProvider;

  let options;
  try {
    options = await provider({ province, provinceCode: PROVINCE_CODES[province], zip: cp, pkg });
    if (!options?.length) throw new Error('sin opciones');
  } catch (err) {
    if (provider !== zonesProvider) console.error(`[envios] ${providerName} falló, uso tabla de zonas:`, err.message);
    options = zonesProvider({ province, zip: cp, pkg });
  }

  options.sort((a, b) => a.cost - b.cost);
  // Envío gratis: se aplica a la opción a domicilio más barata
  const free = subtotal >= FREE_SHIPPING_FROM;
  if (free) {
    const home = options.find((o) => o.deliveryType === 'D') || options[0];
    home.baseCost = home.cost;
    home.cost = 0;
    home.free = true;
  }
  return { options, freeFrom: FREE_SHIPPING_FROM, free, package: pkg };
}
