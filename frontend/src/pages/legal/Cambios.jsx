import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import { SITE } from '../../config/site';

export default function Cambios() {
  return (
    <LegalPage title="Cambios y devoluciones" description="Cómo cambiar o devolver un producto comprado en Luzca.">
      <h2>Arrepentimiento (10 días)</h2>
      <p>Tenés 10 días corridos desde que recibís el producto para arrepentirte de la compra, sin dar explicaciones. Iniciá el trámite desde el <Link to="/arrepentimiento">Botón de arrepentimiento</Link>: te damos un código y te contactamos en 24 hs hábiles. El costo de la devolución corre por nuestra cuenta y te reintegramos el total por el mismo medio de pago.</p>
      <p>El producto tiene que estar sin uso y con su embalaje original.</p>

      <h2>Cambios</h2>
      <p>Si querés cambiar un producto por otro (color, modelo), escribinos dentro de los 30 días de recibido a {SITE.supportEmail}. El producto tiene que estar sin uso y en su embalaje original.</p>

      <h2>Productos fallados</h2>
      <p>Si el producto tiene una falla de fabricación, estás cubierto por la garantía legal de 6 meses. Escribinos con fotos o video y lo reparamos, reemplazamos o te devolvemos el dinero, sin costo de envío.</p>
    </LegalPage>
  );
}
