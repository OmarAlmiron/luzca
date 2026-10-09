import { useEffect } from 'react';

const DEFAULT_TITLE = 'Luzca | Lámparas y Diseño para tu Casa';
const DEFAULT_DESC = 'Luzca — lámparas y objetos de diseño premium para tu casa. Envíos a todo el país.';

// Título y descripción por página (SEO y pestaña del navegador)
export default function usePageMeta(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Luzca` : DEFAULT_TITLE;
    const tag = document.querySelector('meta[name="description"]');
    if (tag) tag.setAttribute('content', description || DEFAULT_DESC);
    return () => {
      document.title = DEFAULT_TITLE;
      if (tag) tag.setAttribute('content', DEFAULT_DESC);
    };
  }, [title, description]);
}
