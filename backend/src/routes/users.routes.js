import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({ name: z.string().min(2).optional(), phone: z.string().optional() });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

router.get('/me/addresses', requireAuth, async (req, res, next) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

router.post('/me/addresses', requireAuth, async (req, res, next) => {
  try {
    const schema = z.object({
      label: z.string().optional(),
      street: z.string().min(3),
      city: z.string().min(2),
      province: z.string().min(2),
      zip: z.string().min(3),
      lat: z.number().optional(),
      lng: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const address = await prisma.address.create({ data: { ...data, userId: req.user.id } });
    res.status(201).json(address);
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
