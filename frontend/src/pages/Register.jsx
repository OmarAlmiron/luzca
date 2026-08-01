import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('¡Cuenta creada!');
      navigate('/panel');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos crear la cuenta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-20 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-8">Crear cuenta</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required placeholder="Nombre completo" className="w-full border border-sand rounded-xl px-4 py-3"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="email" placeholder="Email" className="w-full border border-sand rounded-xl px-4 py-3"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Contraseña (mín. 8 caracteres)" className="w-full border border-sand rounded-xl px-4 py-3"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Creando...' : 'Crear cuenta'}</button>
      </form>
      <p className="text-sm text-espresso/60 mt-6">¿Ya tenés cuenta? <Link to="/login" className="text-clay underline">Iniciá sesión</Link></p>
    </div>
  );
}
