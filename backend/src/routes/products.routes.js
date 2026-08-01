import { Router } from 'express';
import prisma from '../config/db.js';

const router = Router();

// GET /api/products?category=&search=&featured=&sort=&page=&limit=
router.get('/', async (req, res, next) => {
  try {
    const { category, search, featured, sort, page = 1, limit = 12 } = req.query;
    const where = {};
    if (category) where.category = { slug: category };
    if (featured) where.featured = featured === 'true';
    if (search) where.name = { contains: search };

    const orderBy =
      sort === 'price-asc' ? { price: 'asc' } :
      sort === 'price-desc' ? { price: 'desc' } :
      { createdAt: 'desc' };

    const take = Math.min(Number(limit), 48);
    const skip = (Number(page) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.product.findMany({ where, orderBy, take, skip, include: { category: true } }),
      prisma.product.count({ where }),
    ]);

    res.json({
      items: items.map((p) => ({ ...p, images: JSON.parse(p.images) })),
      total,
      page: Number(page),
      totalPages: Math.ceil(total / take),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ include: { _count: { select: { products: true } } } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ...product, images: JSON.parse(product.images) });
  } catch (err) {
    next(err);
  }
});

export default router;
