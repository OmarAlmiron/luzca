// Le da permisos de administrador a un usuario ya registrado en la web.
// Uso (desde la carpeta backend): node prisma/hacer-admin.js tu@email.com
// Para sacarle el permiso:        node prisma/hacer-admin.js tu@email.com --quitar
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const email = (process.argv[2] || '').trim().toLowerCase();
const quitar = process.argv.includes('--quitar');

if (!email || !email.includes('@')) {
  console.error('Uso: node prisma/hacer-admin.js tu@email.com [--quitar]');
  process.exit(1);
}

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error(`No existe un usuario con el email ${email}. Registrate primero en la web.`);
  process.exit(1);
}
await prisma.user.update({ where: { email }, data: { role: quitar ? 'customer' : 'admin' } });
console.log(quitar ? `${email} ya no es administrador.` : `Listo: ${email} ahora es administrador. Cerrá sesión y volvé a entrar.`);
await prisma.$disconnect();
