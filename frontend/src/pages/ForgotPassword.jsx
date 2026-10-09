import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos procesar el pedido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-20 max-w-md mx-auto">
      <h1 className="font-display text-3xl mb-2">Recuperar contraseña</h1>
      {sent ? (
        <p className="text-espresso/70">Si <strong>{email}</strong> tiene una cuenta, te enviamos un email con un link para elegir una nueva contraseña. Revisá también la carpeta de spam. El link vence en 1 hora.</p>
      ) : (
        <>
          <p className="text-espresso/60 mb-8">Ingresá tu email y te mandamos un link para restablecerla.</p>
          <form onSubmit={submit} className="space-y-4">
            <input required type="email" placeholder="Email" className="w-full border border-sand rounded-xl px-4 py-3"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar link'}</button>
          </form>
        </>
      )}
      <p className="text-sm mt-6"><Link to="/login" className="text-clay underline">Volver a iniciar sesión</Link></p>
    </div>
  );
}
