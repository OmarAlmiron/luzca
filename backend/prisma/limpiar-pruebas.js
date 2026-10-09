// Limpia los datos de prueba de la base (pedidos y mensajes de contacto).
// NO toca productos, categorías ni usuarios.
//
// Uso (desde la carpeta backend, con DATABASE_URL apuntando a la base que querés limpiar):
//   node prisma/limpiar-pruebas.js            -> solo MUESTRA lo que borraría
//   node prisma/limpiar-pruebas.js --borrar   -> borra de verdad
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const BORRAR = process.argv.includes('--borrar');

async function main() {
  const host = (process.env.DATABASE_URL || '').split('@')[1]?.split('/')[0] || '(sin DATABASE_URL)';
  console.log(`Base: ${host}\n`);

  const orders = await prisma.order.findMany({
    include: { user: { select: { email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  const msgs = await prisma.contactMessage.count();
  const users = await prisma.user.findMany({ select: { email: true, role: true } });

  console.log(`Pedidos (${orders.length}):`);
  for (const o of orders) {
    console.log(`  ${o.createdAt.toISOString().slice(0, 16)}  ${o.status.padEnd(9)} $${o.total}  ${o.user.email}  ${o.id}`);
  }
  console.log(`\nMensajes de contacto: ${msgs}`);
  console.log(`\nUsuarios (NO se borran): ${users.map((u) => `${u.email} [${u.role}]`).join(', ')}`);

  if (!BORRAR) {
    console.log('\nModo vista previa. Para borrar pedidos y mensajes corré con --borrar');
    return;
  }

  const items = await prisma.orderItem.deleteMany({});
  const ords = await prisma.order.deleteMany({});
  const cm = await prisma.contactMessage.deleteMany({});
  console.log(`\nBorrados: ${ords.count} pedidos, ${items.count} items, ${cm.count} mensajes.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
