import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { sendMail, contactAckTemplate } from '../utils/email.js';

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  subject: z.string().min(2).max(120),
  message: z.string().min(5).max(2000),
});

router.post('/', async (req, res, next) => {
  try {
    const data = contactSchema.parse(req.body);
    const msg = await prisma.contactMessage.create({ data });

    await sendMail({ to: data.email, subject: 'Recibimos tu consulta — Luzca', html: contactAckTemplate(data.name) });
    await sendMail({
      to: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
      subject: `Nueva consulta: ${data.subject}`,
      html: `<p>${data.name} (${data.email})</p><p>${data.message}</p>`,
    });

    res.status(201).json({ ok: true, id: msg.id });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
});

export default router;
