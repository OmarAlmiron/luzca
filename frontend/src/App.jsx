import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ComingSoon from './pages/ComingSoon';

import Home from './pages/Home';
import Catalog from './pages/Catalog';
import Product from './pages/Product';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Contact from './pages/Contact';
import About from './pages/About';
import NotFound from './pages/NotFound';

// Modo "en construccion": se activa con la variable de entorno VITE_MAINTENANCE_MODE=true.
// Para seguir probando el sitio vos mismo mientras esta activado, entra una vez a
// https://tu-dominio/?preview=CLAVE (usando el valor de VITE_PREVIEW_KEY) y va a quedar
// habilitado en ese navegador hasta que lo borres del localStorage.
function useMaintenanceBypass() {
  const [allowed, setAllowed] = useState(() => localStorage.getItem('luzca_preview') === 'true');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get('preview');
    const expected = import.meta.env.VITE_PREVIEW_KEY;
    if (key && expected && key === expected) {
      localStorage.setItem('luzca_preview', 'true');
      setAllowed(true);
    }
  }, []);

  return allowed;
}

export default function App() {
  const maintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  const bypassed = useMaintenanceBypass();

  if (maintenanceMode && !bypassed) {
    return <ComingSoon />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Toaster position="top-center" />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalog />} />
          <Route path="/producto/:slug" element={<Product />} />
          <Route path="/carrito" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/checkout/:status" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/panel" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/contacto" element={<Contact />} />
          <Route path="/sobre-nosotros" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
