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

// CORS middleware personalizado que explícitamente establece headers
export const corsMiddleware = (req, res, next) => {
  // SIEMPRE permitir CORS desde cualquier origen
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.header('Access-Control-Max-Age', '86400');
  res.header('X-CORS-Middleware', 'active');

  // Maneja preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

export const hppMiddleware = hpp();
export const xssMiddleware = xss();