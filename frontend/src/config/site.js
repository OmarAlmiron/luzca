// Datos del negocio. Se configuran con variables de entorno en Vercel (VITE_...).
// Mientras no estén cargadas se muestran estos valores por defecto.
const env = import.meta.env;

export const SITE = {
  name: 'Luzca',
  url: 'https://luzca.com.ar',
  legalName: env.VITE_RAZON_SOCIAL || '[Razón social]',
  cuit: env.VITE_CUIT || '[CUIT]',
  fiscalAddress: env.VITE_DOMICILIO_FISCAL || '[Domicilio fiscal]',
  arcaQrUrl: env.VITE_ARCA_QR_URL || '',   // link del "Data Fiscal" (formulario 960) que da ARCA
  arcaQrImg: env.VITE_ARCA_QR_IMG || '',   // imagen del QR que da ARCA
  supportEmail: env.VITE_SUPPORT_EMAIL || 'soporte@luzca.com.ar',
  phone: env.VITE_PHONE || '',
  whatsapp: (env.VITE_WHATSAPP || '').replace(/\D/g, ''), // ej: 5491155550100
  instagram: env.VITE_INSTAGRAM || '',
  facebook: env.VITE_FACEBOOK || '',
  gaId: env.VITE_GA_ID || '',               // Google Analytics 4, ej: G-XXXXXXX
  freeShippingFrom: 80000,
};

// Link obligatorio a la Ventanilla Única Federal de Defensa del Consumidor
export const DEFENSA_CONSUMIDOR_URL = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario';
