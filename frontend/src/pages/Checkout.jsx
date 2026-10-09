import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AddressFields from '../components/AddressFields';
import { EMPTY_ADDRESS } from '../data/provinces';

const money = (n) => `$${Number(n).toLocaleString('es-AR')}`;

// Pantalla de vuelta desde Mercado Pago (/checkout/exito | error | pendiente)
function CheckoutResult({ status }) {
  const views = {
    exito: { title: '¡Gracias por tu compra!', text: 'Tu pago fue aprobado. Te enviamos un mail con el detalle y te avisamos cuando despachemos el pedido.' },
    pendiente: { title: 'Tu pago está pendiente', text: 'Mercado Pago está procesando el pago. Te avisamos por mail apenas se acredite.' },
    error: { title: 'El pago no se pudo completar', text: 'No se realizó ningún cobro. Podés intentarlo de nuevo con otro medio de pago.' },
  };
  const v = views[status] || views.error;
  return (
    <div className="container-x py-24 max-w-xl mx-auto text-center">
      <h1 className="font-display text-3xl mb-4">{v.title}</h1>
      <p className="text-espresso/70 mb-8">{v.text}</p>
      <div className="flex gap-4 justify-center">
        <Link to="/panel" className="btn-primary">Ver mis pedidos</Link>
        <Link to="/catalogo" className="underline self-center">Seguir comprando</Link>
      </div>
    </div>
  );
}

export default function Checkout() {
  const { status } = useParams();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(EMPTY_ADDRESS);
  const [quote, setQuote] = useState(null); // { options, freeFrom, free }
  const [optionId, setOptionId] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const [loading, setLoading] = useState(false);

  // Precargar la dirección guardada del usuario
  useEffect(() => {
    if (user?.address) {
      const a = user.address;
      setAddress({ ...EMPTY_ADDRESS, ...Object.fromEntries(Object.entries(a).map(([k, v]) => [k, v ?? ''])) });
    }
  }, [user]);

  // Cotizar el envío cuando cambian provincia / CP / carrito
  const cartKey = items.map((i) => `${i.id}:${i.quantity}`).join(',');
  useEffect(() => {
    if (!items.length || !address.province || address.zip.trim().length < 4) { setQuote(null); setQuoteError(''); return; }
    const t = setTimeout(() => {
      api.post('/shipping/quote', {
        province: address.province,
        zip: address.zip.trim(),
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
      })
        .then((r) => {
          setQuote(r.data);
          setQuoteError('');
          setOptionId((prev) => (r.data.options.some((o) => o.id === prev) ? prev : r.data.options[0]?.id || ''));
        })
        .catch((err) => { setQuote(null); setQuoteError(err.response?.data?.error || 'No pudimos cotizar el envío'); });
    }, 400);
    return () => clearTimeout(t);
  }, [address.province, address.zip, cartKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const selected = quote?.options.find((o) => o.id === optionId) || null;

  if (status) return <CheckoutResult status={status} />;

  if (!items.length) {
    return (
      <div className="container-x py-24 text-center">
        <p className="mb-6">Tu carrito está vacío.</p>
        <Link to="/catalogo" className="btn-primary">Ver catálogo</Link>
      </div>
    );
  }

  async function handlePay(e) {
    e.preventDefault();
    if (!user) { toast.error('Iniciá sesión para continuar'); navigate('/login'); return; }
    if (!selected) { toast.error(quoteError || 'Completá la dirección para calcular el envío'); return; }
    setLoading(true);
    try {
      const { label, id, userId, isDefault, country, lat, lng, ...addr } = address;
      const { data: order } = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        address: addr,
        saveAddress: true,
        shippingOptionId: selected.id,
      });
      const { data: pref } = await api.post(`/payments/create-preference/${order.id}`);
      clearCart();
      window.location.href = pref.initPoint;
    } catch (err) {
      toast.error(err.response?.data?.error || 'No pudimos procesar el pago. Probá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  const shipping = selected ? selected.cost : null;

  return (
    <div className="container-x py-12 grid md:grid-cols-3 gap-10">
      <form onSubmit={handlePay} className="md:col-span-2 space-y-6">
        <h1 className="font-display text-3xl">Dirección de envío</h1>
        {user && (
          <p className="text-sm text-espresso/60">
            Recibe: <strong>{user.name}</strong>{user.dni ? ` · DNI ${user.dni}` : ''}{user.phone ? ` · ${user.phone}` : ''}
          </p>
        )}
        <AddressFields value={address} onChange={setAddress} />

        {quoteError && <p className="text-sm text-red-700">{quoteError}</p>}
        {quote && (
          <div className="space-y-2">
            <h2 className="font-display text-xl">Forma de envío</h2>
            {quote.options.map((o) => (
              <label key={o.id} className={`border rounded-xl p-4 text-sm flex justify-between items-center gap-3 cursor-pointer ${optionId === o.id ? 'border-clay bg-sand/30' : 'border-sand'}`}>
                <span className="flex items-start gap-3">
                  <input type="radio" name="shipping" className="mt-1" checked={optionId === o.id} onChange={() => setOptionId(o.id)} />
                  <span>
                    <strong>{o.service}</strong> · {o.carrier}{o.zoneLabel ? ` · ${o.zoneLabel}` : ''}
                    <br /><span className="text-espresso/60">{o.deliveryType === 'S' ? 'Retirás en sucursal' : 'Llega a tu casa'} en {o.eta}</span>
                  </span>
                </span>
                <strong>{o.cost === 0 ? 'Gratis' : money(o.cost)}</strong>
              </label>
            ))}
          </div>
        )}

        <div className="bg-sand/30 rounded-xl p-4 text-sm text-espresso/70">
          Vas a ser redirigido a <strong>Mercado Pago</strong> para completar el pago de forma segura (tarjeta, débito, transferencia o dinero en cuenta).
        </div>

        <button disabled={loading || !selected} className="btn-primary w-full disabled:opacity-50">
          {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
        </button>
      </form>

      <div className="bg-sand/30 rounded-2xl p-6 h-fit">
        <h2 className="font-display text-2xl mb-4">Tu pedido</h2>
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-sm mb-2">
            <span>{i.name} x{i.quantity}</span><span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="border-t border-sand mt-4 pt-4 flex justify-between text-sm">
          <span>Envío</span>
          <span>{shipping === null ? 'Ingresá tu dirección' : shipping === 0 ? 'Gratis' : money(shipping)}</span>
        </div>
        {quote && !quote.free && (
          <p className="text-xs text-espresso/60 mt-1">Envío gratis desde {money(quote.freeFrom)}</p>
        )}
        <div className="flex justify-between font-semibold text-lg mt-2">
          <span>Total</span><span>{money(subtotal + (shipping || 0))}</span>
        </div>
      </div>
    </div>
  );
}
