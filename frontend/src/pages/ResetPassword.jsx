import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const [pw, setPw] = useState({ a: '', b: '' });
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (pw.a !== pw.b) { toast.error('Las contraseñas no coinciden'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: pw.a });
      toast.success('Contraseña actualizada. Ya podés iniciar sesión.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="container-x py-20 max-w-md mx-auto">
        <p>El link no es válido. <Link to="/recuperar-clave" className="text-clay underline">Pedí uno nuevo</Link>.</p>
      </div>
    );
  }

  return (
    <div className="container-x py-20 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-8">Elegí tu nueva contraseña</h1>
      <form onSubmit={submit} className="space-y-4">
        <input required type="password" minLength={8} placeholder="Nueva contraseña (mín. 8)" autoComplete="new-password"
          className="w-full border border-sand rounded-xl px-4 py-3" value={pw.a} onChange={(e) => setPw({ ...pw, a: e.target.value })} />
        <input required type="password" minLength={8} placeholder="Repetir contraseña" autoComplete="new-password"
          className="w-full border border-sand rounded-xl px-4 py-3" value={pw.b} onChange={(e) => setPw({ ...pw, b: e.target.value })} />
        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Guardando...' : 'Guardar contraseña'}</button>
      </form>
    </div>
  );
}
