import { z } from 'zod';
import { PROVINCES, normalizeZip } from './shipping.js';

export const addressSchema = z.object({
  label: z.string().max(30).optional(),
  street: z.string().trim().min(2, 'Ingresá la calle').max(100),
  number: z.string().trim().min(1, 'Ingresá la altura').max(10),
  apartment: z.string().trim().max(30).optional().or(z.literal('')),
  notes: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().min(2, 'Ingresá la localidad').max(80),
  province: z.enum(PROVINCES, { errorMap: () => ({ message: 'Elegí una provincia' }) }),
  zip: z.string().trim().refine((v) => normalizeZip(v), 'Código postal inválido (ej: 1043 o C1043AAB)'),
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(2, 'Ingresá tu nombre').max(50),
  lastName: z.string().trim().min(2, 'Ingresá tu apellido').max(50),
  dni: z.string().trim().regex(/^\d{7,8}$/, 'El DNI tiene que tener 7 u 8 números, sin puntos'),
  phone: z.string().trim().regex(/^[\d\s+()-]{8,20}$/, 'Ingresá un teléfono válido (con código de área)'),
  birthDate: z.string().optional().or(z.literal('')),
});

export function formatAddress(a) {
  const apt = a.apartment ? `, ${a.apartment}` : '';
  return `${a.street} ${a.number}${apt}, ${a.city}, ${a.province} (CP ${a.zip})`;
}

export function publicUser(user, address) {
  return {
    id: user.id,
    name: user.name,
    firstName: user.firstName,
    lastName: user.lastName,
    dni: user.dni,
    email: user.email,
    phone: user.phone,
    role: user.role,
    address: address || null,
  };
}
