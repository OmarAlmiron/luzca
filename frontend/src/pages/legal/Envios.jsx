import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import { SITE } from '../../config/site';

const zones = [
  ['CABA y GBA', '1 a 3 días hábiles'],
  ['Interior de Buenos Aires', '3 a 5 días hábiles'],
  ['Córdoba, Santa Fe, Entre Ríos y La Pampa', '3 a 6 días hábiles'],
  ['Norte y Cuyo', '4 a 8 días hábiles'],
  ['Patagonia', '5 a 9 días hábiles'],
  ['Tierra del Fuego', '6 a 10 días hábiles'],
];

export default function Envios() {
  return (
    <LegalPage title="Envíos y seguimiento" description="Costos, plazos y seguimiento de envíos de Luzca a todo el país.">
      <p>Enviamos a todo el país. El costo exacto se calcula automáticamente en el checkout según tu provincia y código postal, antes de pagar. <strong>Envío gratis en compras desde ${SITE.freeShippingFrom.toLocaleString('es-AR')}.</strong></p>

      <h2>Plazos estimados</h2>
      <p>Despachamos dentro de las 48 hs hábiles de acreditado el pago. Desde el despacho:</p>
      <div className="border border-sand rounded-2xl overflow-hidden">
        {zones.map(([z, d]) => (
          <div key={z} className="flex justify-between px-4 py-3 border-b border-sand last:border-0 text-sm">
            <span>{z}</span><span className="text-espresso/60">{d}</span>
          </div>
        ))}
      </div>

      <h2>Seguimiento</h2>
      <p>Cuando despachamos tu pedido te enviamos un email con el correo y el código de seguimiento. También lo ves en <Link to="/panel">Mi cuenta → Mis pedidos</Link>.</p>

      <h2>Al recibir</h2>
      <p>Revisá el paquete al recibirlo. Si llega dañado, sacale fotos y escribinos dentro de las 48 hs a {SITE.supportEmail}: lo resolvemos sin costo para vos.</p>
    </LegalPage>
  );
}
