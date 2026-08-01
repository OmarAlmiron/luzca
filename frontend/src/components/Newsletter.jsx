import { useState } from 'react';
import toast from 'react-hot-toast';

export default function Newsletter() {
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!email) return;
    toast.success('¡Gracias por sumarte! Revisá tu correo.');
    setEmail('');
  }

  return (
    <section className="bg-espresso text-cream py-16">
      <div className="container-x text-center max-w-xl mx-auto">
        <h3 className="font-display text-3xl mb-3">Sumate a la lista de diseño</h3>
        <p className="text-cream/70 mb-6">Novedades, lanzamientos exclusivos y descuentos antes que nadie.</p>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="email" required placeholder="tu@email.com" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-5 py-3 rounded-full text-espresso outline-none"
          />
          <button className="btn-primary bg-gold text-night hover:bg-cream">Suscribirme</button>
        </form>
      </div>
    </section>
  );
}
