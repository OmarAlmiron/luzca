import { Router } from 'express';
import { z } from 'zod';
import { quoteShipping, PROVINCES, FREE_SHIPPING_FROM } from '../utils/shipping.js';

const router = Router();

router.get('/provinces', (req, res) => res.json({ provinces: PROVINCES, freeFrom: FREE_SHIPPING_FROM }));

router.post('/quote', (req, res, next) => {
  try {
    const data = z.object({
      province: z.string(),
      zip: z.string(),
      subtotal: z.number().nonnegative().optional(),
    }).parse(req.body);
    res.json(quoteShipping(data));
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Datos de envío inválidos' });
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
