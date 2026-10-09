import LegalPage from './LegalPage';
import { SITE } from '../../config/site';

export default function Privacidad() {
  return (
    <LegalPage title="Política de privacidad" description="Cómo cuidamos y usamos tus datos personales en Luzca.">
      <p><strong>{SITE.legalName}</strong> (CUIT {SITE.cuit}) es responsable de la base de datos de clientes de Luzca, conforme a la Ley 25.326 de Protección de Datos Personales.</p>

      <h2>Qué datos pedimos</h2>
      <ul>
        <li>Nombre, apellido, DNI, email, teléfono y fecha de nacimiento (opcional).</li>
        <li>Direcciones de entrega.</li>
        <li>Historial de pedidos. No guardamos datos de tarjetas: los pagos se procesan en Mercado Pago.</li>
        <li>Datos de navegación anónimos (Google Analytics) para mejorar el sitio.</li>
      </ul>

      <h2>Para qué los usamos</h2>
      <ul>
        <li>Procesar, facturar y enviar tus compras.</li>
        <li>Comunicarnos con vos sobre tus pedidos y consultas.</li>
        <li>Enviarte novedades y ofertas, solo si lo aceptaste (podés darte de baja cuando quieras).</li>
      </ul>

      <h2>Con quién los compartimos</h2>
      <p>Solo con quienes necesitamos para operar: Mercado Pago (pagos), la empresa de correo (envíos) y nuestros proveedores de hosting y email. No vendemos ni cedemos tus datos.</p>

      <h2>Seguridad</h2>
      <p>El sitio funciona con conexión cifrada (HTTPS), las contraseñas se guardan cifradas y el acceso a los datos está restringido.</p>

      <h2>Tus derechos</h2>
      <p>Podés acceder, rectificar, actualizar o pedir la supresión de tus datos escribiendo a {SITE.supportEmail}. Respondemos dentro de los plazos legales.</p>
      <p className="text-sm">El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.</p>
    </LegalPage>
  );
}
