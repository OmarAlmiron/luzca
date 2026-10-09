import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../config/db.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';
import { addressSchema, profileSchema, publicUser } from '../utils/validation.js';

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
        addresses: { create: { ...address, label: address.label || 'Casa', isDefault: true } },
      },
      include: { addresses: true },
    });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.status(201).json({ token, user: publicUser(user, user.addresses[0]) });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = signToken(user);
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ token, user: publicUser(user) });
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

export default router;
