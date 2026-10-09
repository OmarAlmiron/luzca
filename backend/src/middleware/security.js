import helmet from 'helmet';
import cors from 'cors';
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

// CORS: solo los dominios permitidos y con credentials (el front usa cookies + withCredentials).
// CLIENT_URL acepta varios dominios separados por coma, ej:
// CLIENT_URL=https://luzca.com.ar,https://www.luzca.com.ar
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Sin Origin (curl, webhooks de Mercado Pago, health checks) -> permitido
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  maxAge: 86400,
});

export const hppMiddleware = hpp();
export const xssMiddleware = xss();