import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('¡Bienvenido de nuevo!');
      navigate('/panel');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-20 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Iniciar sesión</h1>
      <p className="text-espresso/60 mb-8">Demo: demo@luzca.com.ar / Demo1234!</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input required type="email" placeholder="Email" className="w-full border border-sand rounded-xl px-4 py-3"
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input required type="password" placeholder="Contraseña" className="w-full border border-sand rounded-xl px-4 py-3"
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Ingresando...' : 'Ingresar'}</button>
      </form>
      <p className="text-sm text-espresso/60 mt-6">¿No tenés cuenta? <Link to="/registro" className="text-clay underline">Registrate</Link></p>
    </div>
  );
}
