import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE } from '../config/site';

// Google Analytics 4: se activa solo si VITE_GA_ID está configurado
let loaded = false;
function load(id) {
  if (loaded) return;
  loaded = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false, anonymize_ip: true });
}

export default function Analytics() {
  const location = useLocation();
  useEffect(() => {
    if (!SITE.gaId) return;
    load(SITE.gaId);
    window.gtag('event', 'page_view', { page_path: location.pathname + location.search, page_title: document.title });
  }, [location]);
  return null;
}
