import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import { SITE } from '../../config/site';

const faqs = [
  ['¿Cómo pago?', 'Con Mercado Pago: tarjeta de crédito, débito, dinero en cuenta o transferencia. El pago es 100% seguro y no guardamos datos de tarjetas.'],
  ['¿Hacen envíos a todo el país?', `Sí. El costo se calcula en el checkout según tu código postal, y es gratis desde $${SITE.freeShippingFrom.toLocaleString('es-AR')}.`],
  ['¿Cuánto tarda mi pedido?', 'Despachamos en 48 hs hábiles desde que se acredita el pago. Después depende de tu zona: entre 1 y 10 días hábiles.'],
  ['¿Cómo sigo mi envío?', 'Te mandamos un email con el código de seguimiento cuando lo despachamos. También lo ves en Mi cuenta → Mis pedidos.'],
  ['¿Las lámparas incluyen lamparita?', 'Depende del modelo; lo indicamos en la descripción de cada producto. Si no lo dice, escribinos y te confirmamos.'],
  ['¿Puedo devolver un producto?', 'Sí, tenés 10 días desde que lo recibís para arrepentirte, sin costo. Usá el Botón de arrepentimiento.'],
  ['¿Emiten factura?', 'Sí, emitimos factura electrónica por cada compra.'],
  ['¿Tienen local a la calle?', 'Por ahora vendemos solo online. Si necesitás asesoramiento, escribinos.'],
];

export default function FAQ() {
  return (
    <LegalPage title="Preguntas frecuentes" description="Respuestas a las dudas más comunes sobre compras, pagos y envíos en Luzca.">
      <div className="space-y-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="border border-sand rounded-2xl px-5 py-4 group">
            <summary className="font-medium cursor-pointer">{q}</summary>
            <p className="mt-2 text-espresso/70">{a}</p>
          </details>
        ))}
      </div>
      <p className="pt-6">¿No encontraste lo que buscabas? <Link to="/contacto">Escribinos</Link>.</p>
    </LegalPage>
  );
}
