import { Router } from 'express';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';
import { addressSchema, profileSchema, publicUser } from '../utils/validation.js';

const router = Router();

// Actualizar datos personales
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const data = profileSchema.partial().parse(req.body);
    const first = data.firstName ?? req.user.firstName ?? '';
    const last = data.lastName ?? req.user.lastName ?? '';
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...data,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        name: `${first} ${last}`.trim() || req.user.name,
      },
    });
    res.json(publicUser(user));
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.get('/me/addresses', requireAuth, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }],
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

// Crear dirección (si es la primera o viene isDefault, queda como principal)
router.post('/me/addresses', requireAuth, async (req, res, next) => {
  try {
    const data = addressSchema.parse(req.body);
    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const isDefault = count === 0 || req.body.isDefault === true;
    const address = await prisma.$transaction(async (tx) => {
      if (isDefault) await tx.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
      return tx.address.create({ data: { ...data, userId: req.user.id, isDefault } });
    });
    res.status(201).json(address);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

// Editar dirección propia
router.put('/me/addresses/:id', requireAuth, async (req, res, next) => {
  try {
    const data = addressSchema.parse(req.body);
    const { count } = await prisma.address.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data,
    });
    if (!count) return res.status(404).json({ error: 'Dirección no encontrada' });
    res.json(await prisma.address.findUnique({ where: { id: req.params.id } }));
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
