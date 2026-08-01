import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/catalogo?category=lamparas-colgantes', label: 'Colgantes' },
  { to: '/catalogo?category=lamparas-de-pie', label: 'Pie' },
  { to: '/sobre-nosotros', label: 'Nosotros' },
  { to: '/contacto', label: 'Contacto' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-sand">
      <div className="container-x flex items-center justify-between h-20">
        <Link to="/" className="font-display text-2xl tracking-wide">Luz<span className="text-clay">ca</span></Link>

        <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
          {links.map((l) => (
            <NavLink key={l.label} to={l.to} className={({ isActive }) => `hover:text-clay transition ${isActive ? 'text-clay' : ''}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link to="/catalogo" aria-label="Buscar" className="hidden md:block hover:text-clay"><Search size={20} /></Link>
          <Link to={user ? '/panel' : '/login'} aria-label="Cuenta" className="hover:text-clay"><User size={20} /></Link>
          <Link to="/carrito" aria-label="Carrito" className="relative hover:text-clay">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-clay text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{count}</span>
            )}
          </Link>
          <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menú">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sand bg-cream">
          <div className="container-x py-4 flex flex-col gap-4 text-sm font-medium">
            {links.map((l) => (
              <Link key={l.label} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
