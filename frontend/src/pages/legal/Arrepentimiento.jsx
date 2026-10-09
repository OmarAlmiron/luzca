import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import LegalPage from './LegalPage';

const input = 'w-full border border-sand rounded-xl px-4 py-3 bg-white';

export default function Arrepentimiento() {
  const [form, setForm] = useState({ name: '', email: '', dni: '', orderRef: '', reason: '' });
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/withdrawals', form);
      setCode(data.code);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos registrar la solicitud. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <LegalPage title="Botón de arrepentimiento" description="Revocá tu compra dentro de los 10 días de recibido el producto.">
      <p>Tenés 10 días corridos desde que recibiste tu compra para revocarla, sin costo y sin explicar el motivo (Res. 424/2020). Completá el formulario: te damos un código de trámite al instante y te contactamos dentro de las 24 hs hábiles.</p>
      <p className="text-sm">Más info en <Link to="/cambios-y-devoluciones">Cambios y devoluciones</Link>.</p>

      {code ? (
        <div className="border-2 border-clay rounded-2xl p-6 text-center">
          <p className="mb-2">Registramos tu solicitud. Tu código de trámite es:</p>
          <p className="font-display text-3xl text-espresso">{code}</p>
          <p className="text-sm mt-3 text-espresso/60">También te lo enviamos por email.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Nombre y apellido" className={input} value={form.name} onChange={set('name')} />
            <input placeholder="DNI (opcional)" inputMode="numeric" className={input} value={form.dni} onChange={set('dni')} />
          </div>
          <input required type="email" placeholder="Email con el que compraste" className={input} value={form.email} onChange={set('email')} />
          <input placeholder="Número de pedido (ej: 0005KSVS) — opcional" className={input} value={form.orderRef} onChange={set('orderRef')} />
          <textarea rows={3} placeholder="Motivo (opcional)" className={input} value={form.reason} onChange={set('reason')} />
          <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Enviando...' : 'Solicitar arrepentimiento'}</button>
        </form>
      )}
    </LegalPage>
  );
}
