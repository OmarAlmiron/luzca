import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, User, LogOut, MailWarning } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import AddressFields from '../components/AddressFields';
import { EMPTY_ADDRESS } from '../data/provinces';
import usePageMeta from '../hooks/usePageMeta';

const money = (n) => `$${Number(n).toLocaleString('es-AR')}`;
const input = 'w-full border border-sand rounded-xl px-4 py-3 bg-white';

export const STATUS_LABEL = {
  pending: 'Pendiente de pago', paid: 'Pagado · en preparación', shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado',
};
const STATUS_COLOR = {
  pending: 'bg-sand', paid: 'bg-gold/30', shipped: 'bg-clay/30', delivered: 'bg-green-100', cancelled: 'bg-red-100',
};

function Orders() {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data)).catch(() => setOrders([]));
  }, []);

  if (!orders) return <p>Cargando...</p>;
  if (!orders.length) return <p className="text-espresso/60">Todavía no hiciste ningún pedido. <Link to="/catalogo" className="text-clay underline">Ver catálogo</Link></p>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <div key={o.id} className="border border-sand rounded-2xl p-5">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <div>
              <span className="font-medium">Pedido #{o.id.slice(-8).toUpperCase()}</span>
              <span className="text-sm text-espresso/60 ml-3">{new Date(o.createdAt).toLocaleDateString('es-AR')}</span>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${STATUS_COLOR[o.status] || 'bg-sand'}`}>{STATUS_LABEL[o.status] || o.status}</span>
          </div>
          <ul className="text-sm space-y-1 mb-3">
            {o.items.map((it) => (
              <li key={it.id} className="flex justify-between"><span>{it.product?.name} x{it.quantity}</span><span>{money(it.price * it.quantity)}</span></li>
            ))}
            <li className="flex justify-between text-espresso/60"><span>Envío</span><span>{o.shippingCost ? money(o.shippingCost) : 'Gratis'}</span></li>
          </ul>
          <div className="flex justify-between font-semibold"><span>Total</span><span>{money(o.total)}</span></div>
          <p className="text-sm text-espresso/60 mt-3">Envío a: {o.shippingAddr}</p>
          {o.trackingCode && (
            <p className="text-sm mt-2 bg-sand/40 rounded-xl px-3 py-2">
              {o.carrier || 'Correo'} · seguimiento <strong>{o.trackingCode}</strong>
              {o.trackingUrl && <> · <a href={o.trackingUrl} target="_blank" rel="noreferrer" className="text-clay underline">Seguir envío</a></>}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '', dni: user?.dni || '', phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', { ...form, dni: form.dni.replace(/\D/g, '') });
      await refreshUser();
      toast.success('Datos actualizados');
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos guardar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-4 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="Nombre" className={input} value={form.firstName} onChange={set('firstName')} />
        <input required placeholder="Apellido" className={input} value={form.lastName} onChange={set('lastName')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <input required placeholder="DNI" inputMode="numeric" className={input} value={form.dni} onChange={set('dni')} />
        <input required placeholder="Celular" type="tel" className={input} value={form.phone} onChange={set('phone')} />
      </div>
      <input disabled value={user?.email || ''} className={`${input} bg-sand/30`} />
      <p className="text-xs text-espresso/50">Para cambiar el email escribinos a soporte.</p>
      <button disabled={saving} className="btn-primary disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar cambios'}</button>
    </form>
  );
}

function Addresses() {
  const { refreshUser } = useAuth();
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // {id?, ...address}

  const load = () => api.get('/users/me/addresses').then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);

  async function save(e) {
    e.preventDefault();
    const { id, userId, isDefault, country, lat, lng, label, ...addr } = editing;
    try {
      if (id) await api.put(`/users/me/addresses/${id}`, addr);
      else await api.post('/users/me/addresses', addr);
      toast.success('Dirección guardada');
      setEditing(null);
      load();
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos guardar la dirección');
    }
  }

  if (!list) return <p>Cargando...</p>;
  if (editing) {
    return (
      <form onSubmit={save} className="space-y-4 max-w-2xl">
        <AddressFields value={editing} onChange={setEditing} />
        <div className="flex gap-4">
          <button className="btn-primary">Guardar</button>
          <button type="button" onClick={() => setEditing(null)} className="underline">Cancelar</button>
        </div>
      </form>
    );
  }
  return (
    <div className="space-y-3 max-w-2xl">
      {list.map((a) => (
        <div key={a.id} className="border border-sand rounded-2xl p-4 flex justify-between items-start gap-4">
          <div className="text-sm">
            <p className="font-medium">{a.street} {a.number}{a.apartment ? `, ${a.apartment}` : ''} {a.isDefault && <span className="text-xs bg-sand rounded-full px-2 py-0.5 ml-2">Principal</span>}</p>
            <p className="text-espresso/60">{a.city}, {a.province} (CP {a.zip})</p>
            {a.notes && <p className="text-espresso/50">{a.notes}</p>}
          </div>
          <button onClick={() => setEditing({ ...EMPTY_ADDRESS, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ''])) })} className="text-sm underline">Editar</button>
        </div>
      ))}
      <button onClick={() => setEditing({ ...EMPTY_ADDRESS })} className="btn-outline">Agregar dirección</button>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('orders');
  usePageMeta('Mi cuenta');

  async function resend() {
    try {
      await api.post('/auth/resend-verification');
      toast.success('Te reenviamos el email de confirmación');
    } catch {
      toast.error('No pudimos reenviar el email. Probá en unos minutos.');
    }
  }

  const tabs = [
    ['orders', 'Mis pedidos', Package],
    ['profile', 'Mis datos', User],
    ['addresses', 'Direcciones', MapPin],
  ];
  const titles = { orders: 'Mis pedidos', profile: 'Mis datos', addresses: 'Mis direcciones' };

  return (
    <div className="container-x py-12 grid md:grid-cols-4 gap-8">
      <aside className="space-y-2">
        <div className="bg-sand/30 rounded-2xl p-5 mb-4">
          <p className="font-medium">{user?.name}</p>
          <p className="text-sm text-espresso/60 break-all">{user?.email}</p>
        </div>
        {tabs.map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)} className={`flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm ${tab === key ? 'bg-espresso text-cream' : 'hover:bg-sand/50'}`}><Icon size={16} /> {label}</button>
        ))}
        <button onClick={logout} className="flex items-center gap-2 w-full px-4 py-2 rounded-full text-sm text-red-500 hover:bg-red-50"><LogOut size={16} /> Cerrar sesión</button>
      </aside>

      <div className="md:col-span-3">
        {user && user.emailVerified === false && (
          <div className="mb-6 bg-gold/20 rounded-2xl p-4 text-sm flex flex-wrap items-center gap-3">
            <MailWarning size={18} /> Confirmá tu email para recibir las novedades de tus pedidos.
            <button onClick={resend} className="underline">Reenviar email</button>
          </div>
        )}
        <h1 className="font-display text-3xl mb-6">{titles[tab]}</h1>
        {tab === 'orders' && <Orders />}
        {tab === 'profile' && <Profile />}
        {tab === 'addresses' && <Addresses />}
      </div>
    </div>
  );
}
