import { Router } from 'express';
import { z } from 'zod';
import prisma from '../config/db.js';
import { getShippingOptions, PROVINCES, FREE_SHIPPING_FROM } from '../utils/shipping.js';

const router = Router();

router.get('/provinces', (req, res) => res.json({ provinces: PROVINCES, freeFrom: FREE_SHIPPING_FROM }));

// Carga los productos reales del carrito (precio, peso y medidas salen de la base, no del front)
export async function loadCartItems(items) {
  const products = await prisma.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, active: true } });
  return items.map((it) => {
    const product = products.find((p) => p.id === it.productId);
    if (!product) throw Object.assign(new Error('Producto inválido en el carrito'), { status: 400 });
    return { quantity: it.quantity, product };
  });
}

const quoteSchema = z.object({
  province: z.string(),
  zip: z.string(),
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().positive() })).min(1),
});

router.post('/quote', async (req, res, next) => {
  try {
    const data = quoteSchema.parse(req.body);
    const items = await loadCartItems(data.items);
    const { options, freeFrom, free } = await getShippingOptions({ province: data.province, zip: data.zip, items });
    res.json({ options, freeFrom, free });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: 'Datos de envío inválidos' });
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
});

export default router;
