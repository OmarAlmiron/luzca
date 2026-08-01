import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useCart } from '../context/CartContext';

export default function Product() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => setProduct(r.data)).catch(() => setProduct(null));
  }, [slug]);

  if (!product) return <div className="container-x py-24 text-center">Cargando producto...</div>;

  return (
    <div className="container-x py-12 grid md:grid-cols-2 gap-12">
      <div>
        <div className="rounded-2xl overflow-hidden aspect-square bg-sand/40 mb-4">
          <img src={product.images[activeImg]} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex gap-3">
          {product.images.map((img, i) => (
            <button key={i} onClick={() => setActiveImg(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${activeImg === i ? 'border-clay' : 'border-transparent'}`}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Link to={`/catalogo?category=${product.category.slug}`} className="text-xs uppercase tracking-widest text-clay">{product.category.name}</Link>
        <h1 className="font-display text-4xl mt-2 mb-3">{product.name}</h1>
        <div className="flex items-center gap-2 text-sm text-espresso/60 mb-4">
          <Star size={14} className="fill-gold text-gold" /> {product.rating} · {product.reviewsCount} reseñas
        </div>
        <div className="flex items-baseline gap-3 mb-6">
          <span className="text-3xl font-semibold">${product.price.toLocaleString('es-AR')}</span>
          {product.compareAt && <span className="line-through text-espresso/40">${product.compareAt.toLocaleString('es-AR')}</span>}
        </div>
        <p className="text-espresso/70 leading-relaxed mb-8">{product.description}</p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center border border-sand rounded-full">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-10">-</button>
            <span className="w-10 text-center">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} className="w-10 h-10">+</button>
          </div>
          <span className="text-sm text-espresso/60">{product.stock} disponibles</span>
        </div>

        <button
          onClick={() => { addItem(product, qty); toast.success('Agregado al carrito'); }}
          className="btn-primary w-full md:w-auto"
        >
          Agregar al carrito
        </button>

        <div className="grid grid-cols-3 gap-4 mt-10 text-xs text-espresso/70">
          <div className="flex flex-col items-center text-center gap-2"><Truck size={20} className="text-clay" />Envío asegurado</div>
          <div className="flex flex-col items-center text-center gap-2"><ShieldCheck size={20} className="text-clay" />Compra protegida</div>
          <div className="flex flex-col items-center text-center gap-2"><RotateCcw size={20} className="text-clay" />30 días de cambio</div>
        </div>
      </div>
    </div>
  );
}
