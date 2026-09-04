import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss-clean';
import cors from 'cors';

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

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Permite pedidos sin origin (ej. Postman, apps móviles) y los orígenes autorizados
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No autorizado por CORS'));
    }
  },
  credentials: true,
});

export const hppMiddleware = hpp();
export const xssMiddleware = xss();