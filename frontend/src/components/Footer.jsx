import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-night text-cream/80 mt-24">
      <div className="container-x py-16 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="font-display text-2xl text-cream mb-4">Luzca</h3>
          <p className="text-sm leading-relaxed">Lámparas y objetos de diseño para transformar tu casa en un espacio con carácter propio.</p>
          <div className="flex gap-4 mt-5">
            <a href="https://instagram.com" aria-label="Instagram" className="hover:text-gold" target="_blank" rel="noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
            </a>
            <a href="https://facebook.com" aria-label="Facebook" className="hover:text-gold" target="_blank" rel="noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-cream font-medium mb-4">Tienda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/catalogo">Catálogo completo</Link></li>
            <li><Link to="/catalogo?featured=true">Destacados</Link></li>
            <li><Link to="/panel">Mi cuenta</Link></li>
            <li><Link to="/carrito">Carrito</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-cream font-medium mb-4">Ayuda</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contacto">Atención al cliente</Link></li>
            <li><Link to="/envios">Envíos y seguimiento</Link></li>
            <li><Link to="/preguntas-frecuentes">Preguntas frecuentes</Link></li>
            <li><Link to="/politica-privacidad">Privacidad y seguridad</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-cream font-medium mb-4">Contacto</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2"><Mail size={14} /> soporte@luzca.com.ar</li>
            <li className="flex items-center gap-2"><Phone size={14} /> +54 11 5555-0100</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> Buenos Aires, Argentina</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-cream/50">
        © {new Date().getFullYear()} Luzca. Todos los derechos reservados. Pagos protegidos con Mercado Pago.
      </div>
    </footer>
  );
}
