import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/client';
import MapEmbed from '../components/MapEmbed';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success('¡Mensaje enviado! Te responderemos a la brevedad.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos enviar tu mensaje');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-12 grid md:grid-cols-2 gap-12">
      <div>
        <h1 className="font-display text-4xl mb-4">Atención al cliente</h1>
        <p className="text-espresso/60 mb-8">¿Dudas sobre tu pedido, un producto o un envío? Escribinos y te respondemos dentro de las 24hs hábiles.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Nombre" className="w-full border border-sand rounded-xl px-4 py-3"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input required type="email" placeholder="Email" className="w-full border border-sand rounded-xl px-4 py-3"
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input required placeholder="Asunto" className="w-full border border-sand rounded-xl px-4 py-3"
            value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <textarea required placeholder="Mensaje" rows={5} className="w-full border border-sand rounded-xl px-4 py-3"
            value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button disabled={loading} className="btn-primary disabled:opacity-50">{loading ? 'Enviando...' : 'Enviar mensaje'}</button>
        </form>
      </div>
      <div>
        <MapEmbed />
        <div className="mt-6 space-y-2 text-sm text-espresso/70">
          <p><strong>Email:</strong> soporte@luzca.com.ar</p>
          <p><strong>Teléfono:</strong> +54 11 5555-0100</p>
          <p><strong>Horario:</strong> Lunes a viernes, 9 a 18hs</p>
        </div>
      </div>
    </div>
  );
}
