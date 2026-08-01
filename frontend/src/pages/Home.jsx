import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, CreditCard, Headphones } from 'lucide-react';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import Newsletter from '../components/Newsletter';

const categories = [
  { name: 'Lámparas de Mesa', slug: 'lamparas-de-mesa', img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80' },
  { name: 'Lámparas de Pie', slug: 'lamparas-de-pie', img: 'https://images.unsplash.com/photo-1550962328-6c93c48f8b6b?auto=format&fit=crop&w=600&q=80' },
  { name: 'Colgantes', slug: 'lamparas-colgantes', img: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=600&q=80' },
  { name: 'Espejos', slug: 'espejos', img: 'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?auto=format&fit=crop&w=600&q=80' },
];

const perks = [
  { icon: Truck, title: 'Envíos a todo el país', text: 'Seguimiento en tiempo real y notificaciones por email' },
  { icon: ShieldCheck, title: 'Compra 100% segura', text: 'Sitio cifrado y pagos protegidos' },
  { icon: CreditCard, title: 'Mercado Pago y tarjetas', text: 'Hasta 12 cuotas sin interés' },
  { icon: Headphones, title: 'Atención personalizada', text: 'Te ayudamos por chat, mail o teléfono' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/products', { params: { featured: true, limit: 8 } })
      .then((r) => setFeatured(r.data.items))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div>
      <section className="relative h-[90vh] min-h-[560px] flex items-center overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1600&q=80"
          alt="Interior con lámparas de diseño"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-night/80 via-night/30 to-night/10" />
        <div className="container-x relative text-cream">
          <p className="uppercase tracking-[0.3em] text-sm text-gold mb-4">Nueva colección 2026</p>
          <h1 className="font-display text-5xl md:text-7xl max-w-2xl leading-tight">Luz y diseño para cada rincón de tu casa</h1>
          <p className="mt-6 max-w-lg text-cream/80">Lámparas, espejos y objetos de decoración seleccionados para crear ambientes con carácter.</p>
          <div className="mt-8 flex gap-4">
            <Link to="/catalogo" className="btn-primary bg-gold text-night hover:bg-cream">Ver catálogo</Link>
            <Link to="/catalogo?featured=true" className="btn-outline border-cream text-cream hover:bg-cream hover:text-night">Destacados</Link>
          </div>
        </div>
      </section>

      <section className="container-x py-10 grid grid-cols-2 md:grid-cols-4 gap-6">
        {perks.map((p) => (
          <div key={p.title} className="flex flex-col items-center text-center gap-2 p-4">
            <p.icon className="text-clay" size={28} />
            <h4 className="text-sm font-semibold">{p.title}</h4>
            <p className="text-xs text-espresso/60">{p.text}</p>
          </div>
        ))}
      </section>

      <section className="container-x py-16">
        <h2 className="font-display text-3xl mb-8">Explorá por categoría</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((c) => (
            <Link key={c.slug} to={`/catalogo?category=${c.slug}`} className="group relative rounded-2xl overflow-hidden aspect-square">
              <img src={c.img} alt={c.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute inset-0 bg-night/40 group-hover:bg-night/55 transition flex items-end p-4">
                <span className="text-cream font-medium">{c.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl">Piezas destacadas</h2>
          <Link to="/catalogo" className="text-sm hover:text-clay underline">Ver todo</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <Newsletter />
    </div>
  );
}
