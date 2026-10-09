import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { addressSchema, profileSchema, publicUser } from '../utils/validation.js';
import { sendMail, verifyEmailTemplate, resetPasswordTemplate } from '../utils/email.js';

const newToken = () => crypto.randomBytes(32).toString('hex');
const hashToken = (t) => crypto.createHash('sha256').update(t).digest('hex');

const router = Router();

const registerSchema = profileSchema.extend({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Tenés que aceptar los términos y condiciones' }) }),
  marketingOptIn: z.boolean().optional(),
  address: addressSchema,
});

router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(409).json({ error: 'Ese email ya está registrado' });

    const passwordHash = await bcrypt.hash(data.password, 12);
    const verifyToken = newToken();
    const { address, ...p } = data;
    const user = await prisma.user.create({
      data: {
        name: `${p.firstName} ${p.lastName}`,
        firstName: p.firstName,
        lastName: p.lastName,
        dni: p.dni,
        phone: p.phone,
        birthDate: p.birthDate ? new Date(p.birthDate) : null,
        email: p.email,
        passwordHash,
        acceptedTermsAt: new Date(),
        marketingOptIn: !!p.marketingOptIn,
        emailVerifyTokenHash: hashToken(verifyToken),
        addresses: { create: { ...address, label: address.label || 'Casa', isDefault: true } },
      },
      include: { addresses: true },
    });

    sendMail({ to: user.email, subject: 'Confirmá tu email — Luzca', html: verifyEmailTemplate(user, verifyToken) })
      .catch((e) => console.error('Error mail verificación:', e.message));

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({ token, user: publicUser(user, user.addresses[0]) });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// Cuentas del seed con contraseña pública: nunca pueden iniciar sesión
const BLOCKED_EMAILS = ['demo@luzca.com.ar', 'admin@luzca.com.ar'];

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    if (BLOCKED_EMAILS.includes(data.email)) return res.status(401).json({ error: 'Credenciales inválidas' });
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    const address = await prisma.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: 'desc' }] });
    res.json({ token, user: publicUser(user, address) });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const address = await prisma.address.findFirst({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }],
    });
    res.json(publicUser(req.user, address));
  } catch (err) {
    next(err);
  }
});

// Confirmar email desde el link del mail
router.post('/verify-email', async (req, res, next) => {
  try {
    const { token } = z.object({ token: z.string().min(20) }).parse(req.body);
    const user = await prisma.user.findFirst({ where: { emailVerifyTokenHash: hashToken(token) } });
    if (!user) return res.status(400).json({ error: 'El link no es válido o ya fue usado' });
    await prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date(), emailVerifyTokenHash: null } });
    res.json({ ok: true });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Link inválido' });
    next(err);
  }
});

router.post('/resend-verification', authLimiter, requireAuth, async (req, res, next) => {
  try {
    if (req.user.emailVerifiedAt) return res.json({ ok: true, alreadyVerified: true });
    const token = newToken();
    await prisma.user.update({ where: { id: req.user.id }, data: { emailVerifyTokenHash: hashToken(token) } });
    await sendMail({ to: req.user.email, subject: 'Confirmá tu email — Luzca', html: verifyEmailTemplate(req.user, token) });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Olvidé mi contraseña: siempre responde OK (no revela si el email existe)
router.post('/forgot-password', authLimiter, async (req, res, next) => {
  try {
    const { email } = z.object({ email: z.string().trim().toLowerCase().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const token = newToken();
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: hashToken(token), resetTokenExpires: new Date(Date.now() + 3600 * 1000) },
      });
      sendMail({ to: user.email, subject: 'Restablecer contraseña — Luzca', html: resetPasswordTemplate(user, token) })
        .catch((e) => console.error('Error mail reset:', e.message));
    }
    res.json({ ok: true });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Email inválido' });
    next(err);
  }
});

router.post('/reset-password', authLimiter, async (req, res, next) => {
  try {
    const { token, password } = z.object({
      token: z.string().min(20),
      password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    }).parse(req.body);
    const user = await prisma.user.findFirst({
      where: { resetTokenHash: hashToken(token), resetTokenExpires: { gt: new Date() } },
    });
    if (!user) return res.status(400).json({ error: 'El link venció o ya fue usado. Pedí uno nuevo.' });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, 12),
        resetTokenHash: null,
        resetTokenExpires: null,
        emailVerifiedAt: user.emailVerifiedAt || new Date(), // si recibió el mail, el email es suyo
      },
    });
    res.json({ ok: true });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
