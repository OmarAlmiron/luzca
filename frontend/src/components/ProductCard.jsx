import { Link } from 'react-router-dom';
import { Star, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const image = Array.isArray(product.images) ? product.images[0] : JSON.parse(product.images || '[]')[0];

  return (
    <div className="group">
      <Link to={`/producto/${product.slug}`} className="block overflow-hidden rounded-2xl bg-sand/40 aspect-[4/5] relative">
        <img src={image} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {product.compareAt && (
          <span className="absolute top-3 left-3 bg-clay text-white text-xs px-2 py-1 rounded-full">Oferta</span>
        )}
      </Link>
      <div className="mt-3">
        <Link to={`/producto/${product.slug}`} className="font-medium hover:text-clay">{product.name}</Link>
        <div className="flex items-center gap-1 text-xs text-espresso/60 mt-1">
          <Star size={12} className="fill-gold text-gold" /> {product.rating} ({product.reviewsCount})
        </div>
        <div className="flex items-center justify-between mt-2">
          <div>
            <span className="font-semibold">${product.price.toLocaleString('es-AR')}</span>
            {product.compareAt && <span className="ml-2 text-xs line-through text-espresso/40">${product.compareAt.toLocaleString('es-AR')}</span>}
          </div>
          <button
            onClick={() => { addItem(product); toast.success('Agregado al carrito'); }}
            className="w-9 h-9 rounded-full bg-espresso text-cream flex items-center justify-center hover:bg-gold hover:text-night transition"
            aria-label="Agregar al carrito"
          >
            <ShoppingBag size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
