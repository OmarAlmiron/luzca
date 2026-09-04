import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';

// Cabeceras de seguridad HTTP (CSP, HSTS, no-sniff, etc.)
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https://images.unsplash.com'],
      connectSrc: ["'self'", 'https://api.mercadopago.com'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

// Limita fuerza bruta / abuso de la API
export const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  max: Number(process.env.RATE_LIMIT_MAX || 200),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes, intentá nuevamente en unos minutos.' },
});

// Limite estricto para login/registro (anti fuerza bruta de credenciales)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en 15 minutos.' },
});

// CLIENT_URL admite varios orígenes separados por coma, ej:
// CLIENT_URL=https://luzca.com.ar,https://www.luzca.com.ar,https://luzca.vercel.app
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// CORS middleware personalizado que explícitamente establece headers
export const corsMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  
  // Permite pedidos sin origin (ej. Postman, apps móviles) y los orígenes autorizados
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Maneja preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

export const hppMiddleware = hpp();
export const xssMiddleware = xss();
