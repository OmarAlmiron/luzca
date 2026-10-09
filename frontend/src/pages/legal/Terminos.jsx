import { Link } from 'react-router-dom';
import LegalPage from './LegalPage';
import { SITE, DEFENSA_CONSUMIDOR_URL } from '../../config/site';

export default function Terminos() {
  return (
    <LegalPage title="Términos y condiciones" description="Condiciones de uso y compra en Luzca.">
      <p>Estos términos regulan el uso del sitio <strong>{SITE.url}</strong> y las compras realizadas en él. El sitio es operado por <strong>{SITE.legalName}</strong>, CUIT {SITE.cuit}, con domicilio en {SITE.fiscalAddress} (en adelante, "Luzca"). Al registrarte o comprar aceptás estos términos.</p>

      <h2>1. Cuenta de usuario</h2>
      <p>Para comprar tenés que crear una cuenta con datos verdaderos y mantenerlos actualizados. Sos responsable de la confidencialidad de tu contraseña. Podés pedir la baja de tu cuenta en cualquier momento escribiendo a {SITE.supportEmail}.</p>

      <h2>2. Productos y precios</h2>
      <p>Los precios están expresados en pesos argentinos e incluyen IVA. Las fotos son ilustrativas; puede haber leves diferencias de color o textura propias de los materiales. Los precios y el stock pueden cambiar sin aviso, pero respetamos el precio vigente al momento en que se confirmó tu compra.</p>

      <h2>3. Compra y pago</h2>
      <p>La compra se confirma cuando Mercado Pago aprueba el pago. Te enviamos un email con el detalle. Si el pago es rechazado o queda pendiente, el pedido no se procesa hasta su acreditación. Luzca no almacena datos de tarjetas: el pago se procesa íntegramente en Mercado Pago.</p>

      <h2>4. Envíos</h2>
      <p>El costo y el plazo de envío se informan antes de pagar, según tu dirección. Más información en <Link to="/envios">Envíos</Link>.</p>

      <h2>5. Derecho de arrepentimiento</h2>
      <p>Tenés 10 días corridos desde que recibís el producto para revocar la compra, sin costo y sin necesidad de explicar el motivo (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial). Podés hacerlo desde el <Link to="/arrepentimiento">Botón de arrepentimiento</Link>. Ver también <Link to="/cambios-y-devoluciones">Cambios y devoluciones</Link>.</p>

      <h2>6. Garantía</h2>
      <p>Todos los productos tienen la garantía legal de 6 meses por defectos de fabricación (art. 11 de la Ley 24.240).</p>

      <h2>7. Propiedad intelectual</h2>
      <p>Los textos, imágenes, marcas y diseño del sitio pertenecen a Luzca o a sus licenciantes y no pueden usarse sin autorización.</p>

      <h2>8. Datos personales</h2>
      <p>Tratamos tus datos según la <Link to="/politica-privacidad">Política de privacidad</Link>.</p>

      <h2>9. Consultas y reclamos</h2>
      <p>Podés escribirnos a {SITE.supportEmail} o desde <Link to="/contacto">Contacto</Link>. También podés iniciar un reclamo ante la <a href={DEFENSA_CONSUMIDOR_URL} target="_blank" rel="noreferrer">Ventanilla Única Federal de Defensa del Consumidor</a>.</p>

      <h2>10. Ley aplicable</h2>
      <p>Estos términos se rigen por las leyes de la República Argentina. Para cualquier controversia son competentes los tribunales correspondientes al domicilio del consumidor.</p>
    </LegalPage>
  );
}
