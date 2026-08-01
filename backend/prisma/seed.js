import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const IMG = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const categories = [
  { name: 'Lámparas de Mesa', slug: 'lamparas-de-mesa' },
  { name: 'Lámparas de Pie', slug: 'lamparas-de-pie' },
  { name: 'Lámparas Colgantes', slug: 'lamparas-colgantes' },
  { name: 'Apliques de Pared', slug: 'apliques-de-pared' },
  { name: 'Espejos', slug: 'espejos' },
  { name: 'Decoración', slug: 'decoracion' },
];

const products = [
  { name: 'Lámpara Aurora de Mesa', cat: 'lamparas-de-mesa', price: 45900, img: 'photo-1507473885765-e6ed057f782c' },
  { name: 'Lámpara Nordic Wood', cat: 'lamparas-de-mesa', price: 38500, img: 'photo-1513506003901-1e6a229e2d15' },
  { name: 'Velador Cerámico Terra', cat: 'lamparas-de-mesa', price: 29900, img: 'photo-1524634126442-357e0eac3c14' },
  { name: 'Lámpara de Pie Arco Dorado', cat: 'lamparas-de-pie', price: 89900, img: 'photo-1550962328-6c93c48f8b6b' },
  { name: 'Lámpara de Pie Minimal Black', cat: 'lamparas-de-pie', price: 76500, img: 'photo-1540932239986-30128078f3c5' },
  { name: 'Pie de Salón Boho Rattan', cat: 'lamparas-de-pie', price: 68900, img: 'photo-1524758631624-e2822e304c36' },
  { name: 'Colgante Industrial Copper', cat: 'lamparas-colgantes', price: 54900, img: 'photo-1567016432779-094069958ea5' },
  { name: 'Colgante Cluster Glass', cat: 'lamparas-colgantes', price: 112000, img: 'photo-1493663284031-b7e3aefcae8e' },
  { name: 'Colgante Rattan Bola', cat: 'lamparas-colgantes', price: 47500, img: 'photo-1543198126-b90c1b3e5e1e' },
  { name: 'Aplique Pared Art Deco', cat: 'apliques-de-pared', price: 33900, img: 'photo-1524757147-88a9b0e5d18c' },
  { name: 'Aplique Pared Wave', cat: 'apliques-de-pared', price: 27900, img: 'photo-1495314736024-fa5e4b37b979' },
  { name: 'Espejo Redondo Ravena', cat: 'espejos', price: 62900, img: 'photo-1618221469555-7f3ad97540d6' },
  { name: 'Espejo Arco Boreal', cat: 'espejos', price: 71900, img: 'photo-1618220179428-22790b461013' },
  { name: 'Jarrón Cerámico Duna', cat: 'decoracion', price: 19900, img: 'photo-1578500494198-246f612d3b3d' },
  { name: 'Set Portavelas Ámbar', cat: 'decoracion', price: 15900, img: 'photo-1602872030490-4a484a7b3ba6' },
  { name: 'Reloj de Pared Nordic', cat: 'decoracion', price: 24900, img: 'photo-1495364141860-b0d03eccd065' },
];

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();

  const catMap = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catMap[c.slug] = created.id;
  }

  for (const [i, p] of products.entries()) {
    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        description: `${p.name} — diseño premium que combina materiales nobles y una iluminación cálida para transformar cualquier ambiente de tu casa. Fabricación cuidada, envío asegurado y garantía de 12 meses.`,
        price: p.price,
        compareAt: Math.random() > 0.5 ? Math.round(p.price * 1.2) : null,
        stock: 15 + i,
        images: JSON.stringify([IMG(p.img), IMG(p.img)]),
        featured: i % 4 === 0,
        categoryId: catMap[p.cat],
        rating: Number((4 + Math.random()).toFixed(1)),
        reviewsCount: 10 + i * 3,
      },
    });
  }

  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  await prisma.user.create({
    data: { name: 'Admin Luzca', email: 'admin@luzca.com.ar', passwordHash, role: 'admin' },
  });
  await prisma.user.create({
    data: { name: 'Cliente Demo', email: 'demo@luzca.com.ar', passwordHash, role: 'customer' },
  });

  console.log('✅ Seed completo: categorías, productos y usuarios demo creados.');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
