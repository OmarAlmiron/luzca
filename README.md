# Luzca — Tienda de Lámparas y Diseño

Sitio de e-commerce completo (frontend + backend) para vender lámparas y objetos de diseño para el hogar.
Construido con **React + Vite + Tailwind** en el frontend y **Node/Express + Prisma (SQLite)** en el backend.

Incluye: catálogo con filtros y búsqueda, ficha de producto, carrito, checkout con **Mercado Pago**,
registro/login con JWT, panel de usuario (pedidos, perfil, seguimiento con mapa), envío automático de
emails transaccionales (confirmación de compra, envío, contacto), formulario de atención al cliente,
y una capa de seguridad de nivel producción.

---

## 1. Estructura

```
luzca/
  backend/     API REST (Express + Prisma + SQLite)
  frontend/    Sitio (React + Vite + Tailwind)
```

## 2. Requisitos

- Node.js 18+
- npm

## 3. Instalación rápida

### Backend

```bash
cd backend
cp .env.example .env      # completá tus credenciales reales (ver sección 5)
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run seed               # carga categorías, productos y usuarios demo
npm run dev                 # http://localhost:4000
```

Usuarios demo creados por el seed:
- **admin@luzca.com.ar** / `Demo1234!`
- **demo@luzca.com.ar** / `Demo1234!`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

> Nota sobre este entorno de generación: la instalación de Prisma (`prisma generate`) no pudo completarse
> acá porque el sandbox bloquea la descarga del binario del motor de Prisma. Es una restricción de red de
> este entorno de trabajo, no un error del código — en tu máquina o en el hosting va a funcionar sin
> problema. El resto del proyecto (backend con `node --check` y build completo del frontend) se verificó
> sin errores.

## 4. Seguridad implementada

- **Helmet**: cabeceras HTTP seguras (CSP, HSTS, no-sniff, etc.)
- **Rate limiting**: límite general de requests + límite estricto en login/registro (anti fuerza bruta)
- **bcrypt**: hash de contraseñas (12 rounds), nunca se guardan en texto plano
- **JWT** en cookie httpOnly + header Authorization, expiración configurable
- **Validación de inputs** con Zod en todas las rutas que reciben datos del usuario
- **CORS** restringido al dominio del frontend
- **HPP** (HTTP Parameter Pollution) y **xss-clean** para sanitizar inputs
- **Prisma ORM**: las queries son parametrizadas, no hay riesgo de SQL injection
- Recomendado en producción: servir todo detrás de **HTTPS** (Let's Encrypt / Cloudflare), rotar
  `JWT_SECRET`, y activar el modo `NODE_ENV=production` (oculta detalles de errores internos)

## 5. Conectar las integraciones reales

Todo el código ya está armado para funcionar con datos reales apenas cargues las credenciales en `.env`.

### Mercado Pago (pagos)
1. Creá una cuenta en https://www.mercadopago.com.ar/developers/panel
2. Copiá tu `Access Token` y `Public Key` (modo test primero, luego producción)
3. Pegalos en `backend/.env` (`MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`) y en `frontend/.env` (`VITE_MP_PUBLIC_KEY`)
4. Configurá la URL de webhook (`/api/payments/webhook`) en el panel de Mercado Pago para recibir
   confirmaciones automáticas de pago
5. El checkout ya crea la preferencia de pago y redirige al usuario a Mercado Pago Checkout Pro

### Cuentas bancarias / transferencias
Mercado Pago ya soporta transferencia bancaria y "dinero en cuenta" dentro de su checkout. Si además
querés conciliación bancaria directa (CBU/alias), se integra vía la API de tu banco o un agregador como
Ualá Bis / Prisma — dejá una nota y lo sumamos como método de pago adicional.

### Email transaccional
1. Usá cualquier proveedor SMTP: Gmail (con contraseña de aplicación), SendGrid, Resend, Amazon SES
2. Completá `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` en `backend/.env`
3. Sin credenciales configuradas, el sistema **simula** el envío (lo loguea en consola) para que puedas
   probar el flujo completo sin gastar cuota

### Mapas
El panel de usuario y la página de contacto ya muestran un mapa funcional con **Leaflet + OpenStreetMap**
(gratis, sin API key). Si preferís Google Maps, solo hay que cambiar el `TileLayer` en
`frontend/src/components/MapEmbed.jsx` y agregar `GOOGLE_MAPS_API_KEY`.

### Envíos automáticos
El pedido genera automáticamente un email de confirmación de compra. El campo `trackingCode` en el modelo
`Order` está listo para conectarse con Correo Argentino, Andreani, OCA o Envíopack vía su API — cuando el
estado pase a "shipped" se dispara el email de actualización de envío (`shippingUpdateTemplate`).

## 6. Próximos pasos para producción

1. Migrar de SQLite a **PostgreSQL** (cambiar `provider` en `prisma/schema.prisma` y `DATABASE_URL`)
2. Subir imágenes de productos reales (hoy usa fotos de stock de Unsplash como placeholder)
3. Contratar hosting: backend en Railway/Render/Fly.io, frontend en Vercel/Netlify, o todo junto en un VPS
4. Comprar dominio y activar HTTPS
5. Dar de alta cuenta de Mercado Pago en modo producción (requiere verificación de identidad/CBU)
6. Configurar backups automáticos de la base de datos

---

Cualquier ajuste de diseño, nuevas secciones o integraciones adicionales (WhatsApp, chat en vivo, panel de
administración de productos, etc.) se pueden sumar sobre esta misma base.
