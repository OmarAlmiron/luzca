import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import prisma from '../config/db.js';
import { sendMail, withdrawalAckTemplate, withdrawalAdminTemplate } from '../utils/email.js';

const router = Router();

const schema = z.object({
  name: z.string().trim().min(2, 'Ingresá tu nombre').max(100),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  dni: z.string().trim().regex(/^\d{7,8}$/, 'DNI inválido').optional().or(z.literal('')),
  orderRef: z.string().trim().max(40).optional().or(z.literal('')),
  reason: z.string().trim().max(1000).optional().or(z.literal('')),
});

// Botón de arrepentimiento: no requiere iniciar sesión (Res. 424/2020)
router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const code = `ARR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const w = await prisma.withdrawalRequest.create({
      data: { ...data, dni: data.dni || null, orderRef: data.orderRef || null, reason: data.reason || null, code },
    });

    await sendMail({ to: w.email, subject: `Solicitud de arrepentimiento ${w.code} — Luzca`, html: withdrawalAckTemplate(w) })
      .catch((e) => console.error('Error mail arrepentimiento:', e.message));
    const admin = process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL;
    if (admin) {
      sendMail({ to: admin, subject: `Arrepentimiento ${w.code} — responder en 24 hs`, html: withdrawalAdminTemplate(w) })
        .catch((e) => console.error('Error mail arrepentimiento admin:', e.message));
    }
    res.status(201).json({ code: w.code });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
