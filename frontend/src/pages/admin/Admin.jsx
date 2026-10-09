import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/client';
import usePageMeta from '../../hooks/usePageMeta';
import { STATUS_LABEL } from '../Dashboard';

const money = (n) => `$${Number(n || 0).toLocaleString('es-AR')}`;
const input = 'border border-sand rounded-lg px-3 py-2 bg-white text-sm';
const CARRIERS = ['Correo Argentino', 'Andreani', 'OCA', 'Moto / mensajería', 'Retiro en persona', 'Otro'];
const errMsg = (err) => err.response?.data?.error || 'Error inesperado';

function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setS(r.data)).catch(() => setS({})); }, []);
  if (!s) return <p>Cargando...</p>;
  const cards = [
    ['Ventas últimos 30 días', money(s.revenue30d), `${s.sales30d || 0} pedidos`],
    ['Para despachar', s.ordersByStatus?.paid || 0, 'pagados sin enviar'],
    ['En camino', s.ordersByStatus?.shipped || 0, 'enviados'],
    ['Arrepentimientos abiertos', s.openWithdrawals || 0, 'responder en 24 hs'],
    ['Productos con poco stock', s.lowStock || 0, '3 unidades o menos'],
    ['Clientes registrados', s.customers || 0, ''],
  ];
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map(([t, v, sub]) => (
        <div key={t} className="border border-sand rounded-2xl p-5">
          <p className="text-sm text-espresso/60">{t}</p>
          <p className="font-display text-3xl my-1">{v}</p>
          <p className="text-xs text-espresso/50">{sub}</p>
        </div>
      ))}
    </div>
  );
}

function OrderRow({ o, onSaved }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    status: o.status, carrier: o.carrier || '', trackingCode: o.trackingCode || '', trackingUrl: o.trackingUrl || '', adminNotes: o.adminNotes || '', notify: true,
  });
  const [saving, setSaving] = useState(false);
  const d = o.shippingData || {};
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  async function save() {
    setSaving(true);
    try {
      const body = { ...f };
      Object.keys(body).forEach((k) => { if (body[k] === '' && k !== 'trackingUrl') delete body[k]; });
      const { data } = await api.patch(`/admin/orders/${o.id}`, body);
      toast.success(f.notify && f.status !== o.status && ['shipped', 'delivered'].includes(f.status) ? 'Guardado y cliente avisado por mail' : 'Guardado');
      onSaved(data);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-sand rounded-2xl">
      <button onClick={() => setOpen(!open)} className="w-full flex flex-wrap justify-between items-center gap-2 p-4 text-left">
        <span className="font-medium">#{o.id.slice(-8).toUpperCase()} · {o.user?.name}</span>
        <span className="text-sm text-espresso/60">{new Date(o.createdAt).toLocaleString('es-AR')}</span>
        <span className="text-sm">{money(o.total)}</span>
        <span className="text-xs px-3 py-1 rounded-full bg-sand">{STATUS_LABEL[o.status] || o.status}</span>
      </button>
      {open && (
        <div className="border-t border-sand p-4 grid md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-1">
            <p className="font-medium mb-1">Despachar a</p>
            <p>{d.recipient || o.user?.name} · DNI {d.dni || o.user?.dni || '-'}</p>
            <p>Tel: {d.phone || o.user?.phone || '-'} · {o.user?.email}</p>
            <p>{o.shippingAddr}</p>
            {d.notes && <p className="text-espresso/60">Ref: {d.notes}</p>}
            <p className="font-medium mt-3 mb-1">Productos</p>
            {o.items.map((it) => <p key={it.id}>{it.product?.name} x{it.quantity} — {money(it.price * it.quantity)}</p>)}
            <p>Envío: {o.shippingCost ? money(o.shippingCost) : 'Gratis'} · <strong>Total {money(o.total)}</strong></p>
            <p className="text-espresso/50">Pago MP: {o.paymentId || '-'}</p>
          </div>
          <div className="space-y-3">
            <label className="block">Estado
              <select className={`${input} w-full mt-1`} value={f.status} onChange={set('status')}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <select className={input} value={f.carrier} onChange={set('carrier')}>
                <option value="">Correo</option>
                {CARRIERS.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input placeholder="Código de seguimiento" className={input} value={f.trackingCode} onChange={set('trackingCode')} />
            </div>
            <input placeholder="Link de seguimiento (opcional)" className={`${input} w-full`} value={f.trackingUrl} onChange={set('trackingUrl')} />
            <textarea rows={2} placeholder="Notas internas" className={`${input} w-full`} value={f.adminNotes} onChange={set('adminNotes')} />
            <label className="flex gap-2 items-center"><input type="checkbox" checked={f.notify} onChange={set('notify')} /> Avisar al cliente por mail (enviado / entregado)</label>
            <button disabled={saving} onClick={save} className="btn-primary disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [status, setStatus] = useState('paid');
  const [q, setQ] = useState('');
  const [orders, setOrders] = useState(null);

  const load = () => api.get('/admin/orders', { params: { status: status || undefined, q: q || undefined } })
    .then((r) => setOrders(r.data)).catch((e) => { toast.error(errMsg(e)); setOrders([]); });
  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-5">
        <select className={input} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <input placeholder="Buscar por N°, email o nombre" className={input} value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-outline">Buscar</button>
        </form>
      </div>
      {!orders ? <p>Cargando...</p> : orders.length === 0 ? <p className="text-espresso/60">No hay pedidos.</p> : (
        <div className="space-y-3">
          {orders.map((o) => <OrderRow key={o.id} o={o} onSaved={(n) => setOrders(orders.map((x) => (x.id === n.id ? { ...x, ...n } : x)))} />)}
        </div>
      )}
    </div>
  );
}

function ProductRow({ p, onSaved }) {
  const [f, setF] = useState({ price: p.price, compareAt: p.compareAt ?? '', stock: p.stock, featured: p.featured, active: p.active, weightGrams: p.weightGrams ?? 1500, lengthCm: p.lengthCm ?? 30, widthCm: p.widthCm ?? 30, heightCm: p.heightCm ?? 30 });
  const dims = ['weightGrams', 'lengthCm', 'widthCm', 'heightCm'];
  const dirty = f.price !== p.price || String(f.compareAt) !== String(p.compareAt ?? '') || f.stock !== p.stock || f.featured !== p.featured || f.active !== p.active || dims.some((k) => f[k] !== p[k]);

  async function save() {
    try {
      const { data } = await api.patch(`/admin/products/${p.id}`, {
        price: Number(f.price), compareAt: f.compareAt === '' ? null : Number(f.compareAt),
        stock: Number(f.stock), featured: f.featured, active: f.active,
        weightGrams: Number(f.weightGrams), lengthCm: Number(f.lengthCm), widthCm: Number(f.widthCm), heightCm: Number(f.heightCm),
      });
      toast.success(`${p.name} actualizado`);
      onSaved(data);
    } catch (err) { toast.error(errMsg(err)); }
  }

  return (
    <tr className={`border-b border-sand ${!f.active ? 'opacity-50' : ''}`}>
      <td className="py-2 pr-2">{p.name}<br /><span className="text-xs text-espresso/50">{p.category?.name}</span></td>
      <td className="pr-2"><input type="number" min="1" className={`${input} w-28`} value={f.price} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} /></td>
      <td className="pr-2"><input type="number" min="0" placeholder="—" className={`${input} w-28`} value={f.compareAt} onChange={(e) => setF({ ...f, compareAt: e.target.value })} /></td>
      <td className="pr-2"><input type="number" min="0" className={`${input} w-20 ${f.stock <= 3 ? 'border-red-400' : ''}`} value={f.stock} onChange={(e) => setF({ ...f, stock: Number(e.target.value) })} /></td>
      <td className="pr-2 whitespace-nowrap">
        <input type="number" min="1" title="Peso en gramos" className={`${input} w-20`} value={f.weightGrams} onChange={(e) => setF({ ...f, weightGrams: Number(e.target.value) })} />
        <span className="block text-[11px] text-espresso/50 mt-1">
          <input type="number" min="1" title="Largo cm" className="w-10 border border-sand rounded px-1" value={f.lengthCm} onChange={(e) => setF({ ...f, lengthCm: Number(e.target.value) })} />×
          <input type="number" min="1" title="Ancho cm" className="w-10 border border-sand rounded px-1" value={f.widthCm} onChange={(e) => setF({ ...f, widthCm: Number(e.target.value) })} />×
          <input type="number" min="1" title="Alto cm" className="w-10 border border-sand rounded px-1" value={f.heightCm} onChange={(e) => setF({ ...f, heightCm: Number(e.target.value) })} /> cm
        </span>
      </td>
      <td className="text-center"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /></td>
      <td className="text-center"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /></td>
      <td><button disabled={!dirty} onClick={save} className="text-sm underline disabled:opacity-30">Guardar</button></td>
    </tr>
  );
}

function Products() {
  const [list, setList] = useState(null);
  useEffect(() => { api.get('/admin/products').then((r) => setList(r.data)).catch((e) => { toast.error(errMsg(e)); setList([]); }); }, []);
  if (!list) return <p>Cargando...</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-espresso/60">
          <tr><th className="py-2">Producto</th><th>Precio</th><th>Precio anterior (oferta)</th><th>Stock</th><th>Peso (g) y caja</th><th>Destacado</th><th>Visible</th><th /></tr>
        </thead>
        <tbody>
          {list.map((p) => <ProductRow key={p.id} p={p} onSaved={(n) => setList(list.map((x) => (x.id === n.id ? n : x)))} />)}
        </tbody>
      </table>
    </div>
  );
}

function Withdrawals() {
  const [list, setList] = useState(null);
  const load = () => api.get('/admin/withdrawals').then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  async function setStatus(id, status) {
    try { await api.patch(`/admin/withdrawals/${id}`, { status }); load(); } catch (err) { toast.error(errMsg(err)); }
  }
  if (!list) return <p>Cargando...</p>;
  if (!list.length) return <p className="text-espresso/60">No hay solicitudes.</p>;
  return (
    <div className="space-y-3">
      {list.map((w) => (
        <div key={w.id} className="border border-sand rounded-2xl p-4 text-sm flex flex-wrap justify-between gap-3">
          <div>
            <p className="font-medium">{w.code} · {w.name} {w.dni && `· DNI ${w.dni}`}</p>
            <p><a className="text-clay underline" href={`mailto:${w.email}?subject=Solicitud ${w.code}`}>{w.email}</a> · Pedido: {w.orderRef || '-'}</p>
            {w.reason && <p className="text-espresso/60">{w.reason}</p>}
            <p className="text-xs text-espresso/50">{new Date(w.createdAt).toLocaleString('es-AR')}</p>
          </div>
          <select className={input} value={w.status} onChange={(e) => setStatus(w.id, e.target.value)}>
            <option value="open">Abierta</option><option value="done">Resuelta</option><option value="rejected">Rechazada</option>
          </select>
        </div>
      ))}
    </div>
  );
}

function Messages() {
  const [list, setList] = useState(null);
  const load = () => api.get('/admin/messages').then((r) => setList(r.data)).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  async function toggle(m) {
    try { await api.patch(`/admin/messages/${m.id}`, { status: m.status === 'open' ? 'answered' : 'open' }); load(); } catch (err) { toast.error(errMsg(err)); }
  }
  if (!list) return <p>Cargando...</p>;
  if (!list.length) return <p className="text-espresso/60">No hay mensajes.</p>;
  return (
    <div className="space-y-3">
      {list.map((m) => (
        <div key={m.id} className={`border border-sand rounded-2xl p-4 text-sm ${m.status === 'answered' ? 'opacity-60' : ''}`}>
          <div className="flex flex-wrap justify-between gap-2">
            <p className="font-medium">{m.subject}</p>
            <button onClick={() => toggle(m)} className="underline">{m.status === 'open' ? 'Marcar respondido' : 'Reabrir'}</button>
          </div>
          <p>{m.name} · <a className="text-clay underline" href={`mailto:${m.email}?subject=Re: ${encodeURIComponent(m.subject)}`}>{m.email}</a></p>
          <p className="whitespace-pre-wrap mt-2 text-espresso/80">{m.message}</p>
          <p className="text-xs text-espresso/50 mt-1">{new Date(m.createdAt).toLocaleString('es-AR')}</p>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  ['stats', 'Resumen', Stats],
  ['orders', 'Pedidos', Orders],
  ['products', 'Productos y stock', Products],
  ['withdrawals', 'Arrepentimientos', Withdrawals],
  ['messages', 'Consultas', Messages],
];

export default function Admin() {
  const [tab, setTab] = useState('stats');
  usePageMeta('Administración');
  const Current = TABS.find((t) => t[0] === tab)[2];
  return (
    <div className="container-x py-10">
      <h1 className="font-display text-3xl mb-6">Administración</h1>
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-full text-sm ${tab === k ? 'bg-espresso text-cream' : 'bg-sand/50 hover:bg-sand'}`}>{label}</button>
        ))}
      </div>
      <Current />
    </div>
  );
}
