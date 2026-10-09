import usePageMeta from '../../hooks/usePageMeta';

export default function LegalPage({ title, description, updated = 'octubre de 2026', children }) {
  usePageMeta(title, description);
  return (
    <div className="container-x py-16 max-w-3xl mx-auto">
      <h1 className="font-display text-4xl mb-2">{title}</h1>
      <p className="text-sm text-espresso/50 mb-10">Última actualización: {updated}</p>
      <div className="space-y-5 leading-relaxed text-espresso/80 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-espresso [&_h2]:mt-10 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_a]:text-clay [&_a]:underline">
        {children}
      </div>
    </div>
  );
}
