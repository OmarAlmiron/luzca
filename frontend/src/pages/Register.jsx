import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import AddressFields from '../components/AddressFields';
import { EMPTY_ADDRESS } from '../data/provinces';

const input = 'w-full border border-sand rounded-xl px-4 py-3 bg-white';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '', lastName: '', dni: '', phone: '', birthDate: '',
    email: '', password: '', password2: '', acceptTerms: false, marketingOptIn: false,
  });
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Las contraseñas no coinciden'); return; }
    if (!form.acceptTerms) { toast.error('Tenés que aceptar los términos y condiciones'); return; }
    setLoading(true);
    try {
      const { password2, ...payload } = form;
      await register({ ...payload, dni: form.dni.replace(/\D/g, ''), address });
      toast.success('¡Cuenta creada!');
      navigate('/panel');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-16 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl mb-2">Crear cuenta</h1>
      <p className="text-espresso/60 mb-8">Con estos datos preparamos y enviamos tus pedidos. No los compartimos con nadie.</p>
      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-4">
          <h2 className="font-display text-xl">Datos personales</h2>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Nombre" autoComplete="given-name" className={input} value={form.firstName} onChange={set('firstName')} />
            <input required placeholder="Apellido" autoComplete="family-name" className={input} value={form.lastName} onChange={set('lastName')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="DNI (sin puntos)" inputMode="numeric" className={input} value={form.dni} onChange={set('dni')} />
            <input required placeholder="Celular con código de área" type="tel" autoComplete="tel" className={input} value={form.phone} onChange={set('phone')} />
          </div>
          <label className="block text-sm text-espresso/60">Fecha de nacimiento (opcional)
            <input type="date" className={`${input} mt-1`} value={form.birthDate} onChange={set('birthDate')} />
          </label>
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl">Dirección de entrega</h2>
          <AddressFields value={address} onChange={setAddress} />
        </section>

        <section className="space-y-4">
          <h2 className="font-display text-xl">Acceso</h2>
          <input required type="email" placeholder="Email" autoComplete="email" className={input} value={form.email} onChange={set('email')} />
          <div className="grid grid-cols-2 gap-4">
            <input required type="password" minLength={8} placeholder="Contraseña (mín. 8)" autoComplete="new-password" className={input} value={form.password} onChange={set('password')} />
            <input required type="password" minLength={8} placeholder="Repetir contraseña" autoComplete="new-password" className={input} value={form.password2} onChange={set('password2')} />
          </div>
        </section>

        <div className="space-y-2 text-sm">
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={form.acceptTerms} onChange={set('acceptTerms')} className="mt-1" />
            <span>Acepto los <Link to="/terminos" className="text-clay underline">términos y condiciones</Link> y la <Link to="/politica-privacidad" className="text-clay underline">política de privacidad</Link>.</span>
          </label>
          <label className="flex gap-2 items-start">
            <input type="checkbox" checked={form.marketingOptIn} onChange={set('marketingOptIn')} className="mt-1" />
            <span>Quiero recibir novedades y ofertas por email.</span>
          </label>
        </div>

        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Creando...' : 'Crear cuenta'}</button>
      </form>
      <p className="text-sm text-espresso/60 mt-6">¿Ya tenés cuenta? <Link to="/login" className="text-clay underline">Iniciá sesión</Link></p>
    </div>
  );
}
