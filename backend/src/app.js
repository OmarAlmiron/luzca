import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

// Importar middlewares de seguridad
import { apiLimiter, authLimiter, corsMiddleware, hppMiddleware, xssMiddleware, helmetMiddleware } from './middleware/security.js';

// Importar rutas
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import contactRoutes from './routes/contact.routes.js';
import usersRoutes from './routes/users.routes.js';
import shippingRoutes from './routes/shipping.routes.js';
import adminRoutes from './routes/admin.routes.js';
import withdrawalsRoutes from './routes/withdrawals.routes.js';
import prisma from './config/db.js';
import { siteUrl } from './utils/email.js';

// Importar manejadores de errores
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

// ====== CORS CONFIGURATION ======
// CORS PRIMERO, antes de cualquier otro middleware
app.use(corsMiddleware);

// ====== SECURITY MIDDLEWARES ======
app.set('trust proxy', 1);
app.use(helmetMiddleware);
app.use(hppMiddleware);
app.use(xssMiddleware);

// ====== BODY PARSERS ======
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ====== LOGGING ======
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ====== ROUTES ======
// Health check (sin rate limiting)
// Health check (sin rate limiting): también verifica la base de datos.
// Usalo en un monitor de caídas (UptimeRobot / Better Stack).
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, service: 'luzca-backend', db: 'ok' });
  } catch (err) {
    res.status(503).json({ ok: false, service: 'luzca-backend', db: 'error' });
  }
});

// Sitemap para Google (Vercel lo sirve en luzca.com.ar/sitemap.xml via rewrite)
app.get('/sitemap.xml', async (req, res, next) => {
  try {
    const base = siteUrl();
    const products = await prisma.product.findMany({ where: { active: true }, select: { slug: true, updatedAt: true } });
    const pages = ['', '/catalogo', '/sobre-nosotros', '/contacto', '/envios', '/preguntas-frecuentes', '/terminos', '/politica-privacidad', '/cambios-y-devoluciones'];
    const urls = [
      ...pages.map((p) => `<url><loc>${base}${p}</loc></url>`),
      ...products.map((p) => `<url><loc>${base}/producto/${p.slug}</loc><lastmod>${p.updatedAt.toISOString().slice(0, 10)}</lastmod></url>`),
    ];
    res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`);
  } catch (err) { next(err); }
});

// API routes con rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/withdrawals', withdrawalsRoutes);

// ====== ERROR HANDLING ======
app.use(notFound);
app.use(errorHandler);

export default app;