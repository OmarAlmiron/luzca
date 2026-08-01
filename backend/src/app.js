import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import {
  helmetMiddleware, apiLimiter, corsMiddleware, hppMiddleware, xssMiddleware,
} from './middleware/security.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';
import ordersRoutes from './routes/orders.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import contactRoutes from './routes/contact.routes.js';
import usersRoutes from './routes/users.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(hppMiddleware);
app.use(xssMiddleware);
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'luzca-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/users', usersRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
