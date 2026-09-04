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
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'luzca-backend' });
});

// API routes con rate limiting
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);

// ====== ERROR HANDLING ======
app.use(notFound);
app.use(errorHandler);

export default app;