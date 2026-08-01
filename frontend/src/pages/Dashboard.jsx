import { useEffect, useState } from 'react';
import { Package, MapPin, User, LogOut } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import MapEmbed from '../components/MapEmbed';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('orders');

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  const statusLabel = {
    pending: 'Pendiente de pago', paid: 'Pagado', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
  };

  return (
    <div className="container-x py-12 grid md:grid-cols-4 gap-8">
      <aside className="space-y-2">
        <div className="bg-sand/30 rounded-2xl p-5 mb-4">
          <p className="font-medium">{user?.name}</p>
          <p className="text-sm text-espresso/60">{user?.email}</p>
        </div>
        <button onClick={() => setTab('orders')} className={`flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm ${tab === 'orders' ? 'bg-espresso text-cream' : 'hover:bg-sand/50'}`}><Package size={16} /> Mis pedidos</button>
        <button onClick={() => setTab('profile')} className={`flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm ${tab === 'profile' ? 'bg-espresso text-cream' : 'hover:bg-sand/50'}`}><User size={16} /> Mi perfil</button>
        <button onClick={() => setTab('shipping')} className={`flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm ${tab === 'shipping' ? 'bg-espresso text-cream' : 'hover:bg-sand/50'}`}><MapPin size={16} /> Envíos</button>
        <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm text-red-500 hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button>
      </aside>

      <div className="md:col-span-3">
        {tab === 'orders' && (
          <div>
            <h1 className="font-display text-3xl mb-6">Mis pedidos</h1>
            {orders.length === 0 ? <p className="text-espresso/60">Todavía no hiciste ningún pedido.</p> : (
              <div className="space-y-4">
                {orders.map((o) => (
                  <div key={o.id} className="border border-sand rounded-2xl p-5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">Pedido #{o.id.slice(0, 8)}</span>
                      <span className="text-xs px-3 py-1 rounded-full bg-sand">{statusLabel[o.status] || o.status}</span>
                    </div>
                    <p className="text-sm text-espresso/60">{new Date(o.createdAt).toLocaleDateString('es-AR')}</p>
                    <p className="font-semibold mt-2">${o.total.toLocaleString('es-AR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h1 className="font-display text-3xl mb-6">Mi perfil</h1>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <input disabled defaultValue={user?.name} className="border border-sand rounded-xl px-4 py-3 col-span-2" />
              <input disabled defaultValue={user?.email} className="border border-sand rounded-xl px-4 py-3 col-span-2" />
            </div>
          </div>
        )}

        {tab === 'shipping' && (
          <div>
            <h1 className="font-display text-3xl mb-6">Seguimiento de envíos</h1>
            <MapEmbed />
          </div>
        )}
      </div>
    </div>
  );
}
