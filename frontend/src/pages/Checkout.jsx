import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ street: '', city: '', province: '', zip: '' });
  const [loading, setLoading] = useState(false);

  const shipping = subtotal > 80000 ? 0 : 4500;

  async function handlePay(e) {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para continuar'); navigate('/login'); return; }
    setLoading(true);
    try {
      const shippingAddr = `${address.street}, ${address.city}, ${address.province} (CP ${address.zip})`;
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        shippingAddr,
      });

      const { data: pref } = await api.post(`/payments/create-preference/${order.id}`);
      clearCart();
      // Redirige a Mercado Pago (sandbox o producción según las credenciales configuradas)
      window.location.href = pref.initPoint;
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos procesar el pago. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container-x py-12 grid md:grid-cols-3 gap-10">
      <form onSubmit={handlePay} className="md:col-span-2 space-y-4">
        <h1 className="font-display text-3xl mb-4">Dirección de envío</h1>
        <input required placeholder="Calle y número" className="w-full border border-sand rounded-xl px-4 py-3"
          value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <input required placeholder="Ciudad" className="border border-sand rounded-xl px-4 py-3"
            value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
          <input required placeholder="Provincia" className="border border-sand rounded-xl px-4 py-3"
            value={address.province} onChange={(e) => setAddress({ ...address, province: e.target.value })} />
        </div>
        <input required placeholder="Código postal" className="w-full border border-sand rounded-xl px-4 py-3"
          value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} />

        <div className="bg-sand/30 rounded-xl p-4 text-sm text-espresso/70">
          Vas a ser redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura (tarjeta, débito, transferencia o dinero en cuenta).
        </div>

        <button disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
        </button>
      </form>

      <div className="bg-sand/30 rounded-2xl p-6 h-fit">
        <h2 className="font-display text-2xl mb-4">Tu pedido</h2>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm mb-2">
            <span>{i.name} x{i.quantity}</span><span>${(i.price * i.quantity).toLocaleString('es-AR')}</span>
          </div>
        ))}
        <div className="border-t border-sand mt-4 pt-4 flex justify-between text-sm">
          <span>Envío</span><span>{shipping === 0 ? 'Gratis' : `$${shipping.toLocaleString('es-AR')}`}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg mt-2">
          <span>Total</span><span>${(subtotal + shipping).toLocaleString('es-AR')}</span>
        </div>
      </div>
    </div>
  );
}
