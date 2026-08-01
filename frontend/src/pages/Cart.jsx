import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-x py-24 text-center">
        <h1 className="font-display text-3xl mb-4">Tu carrito está vacío</h1>
        <Link to="/catalogo" className="btn-primary">Ir al catálogo</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-12 grid md:grid-cols-3 gap-10">
      <div className="md:col-span-2 space-y-6">
        <h1 className="font-display text-3xl mb-4">Tu carrito</h1>
        {items.map((item) => (
          <div key={item.id} className="flex gap-4 items-center border-b border-sand pb-6">
            <img src={item.image} alt={item.name} className="w-24 h-24 object-cover rounded-xl" />
            <div className="flex-1">
              <h3 className="font-medium">{item.name}</h3>
              <p className="text-espresso/60 text-sm">${item.price.toLocaleString('es-AR')}</p>
              <div className="flex items-center border border-sand rounded-full w-fit mt-2">
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-8 h-8">-</button>
                <span className="w-8 text-center text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-8 h-8">+</button>
              </div>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-espresso/40 hover:text-red-500"><Trash2 size={18} /></button>
          </div>
        ))}
      </div>

      <div className="bg-sand/30 rounded-2xl p-6 h-fit">
        <h2 className="font-display text-2xl mb-4">Resumen</h2>
        <div className="flex justify-between text-sm mb-2">
          <span>Subtotal</span><span>${subtotal.toLocaleString('es-AR')}</span>
        </div>
        <div className="flex justify-between text-sm mb-4 text-espresso/60">
          <span>Envío</span><span>{subtotal > 80000 ? 'Gratis' : 'Calculado en el checkout'}</span>
        </div>
        <Link to="/checkout" className="btn-primary w-full">Finalizar compra</Link>
      </div>
    </div>
  );
}
