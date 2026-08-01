import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const category = params.get('category') || '';
  const sort = params.get('sort') || '';
  const search = params.get('search') || '';

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/products', { params: { category, sort, search, featured: params.get('featured') || undefined, limit: 24 } })
      .then((r) => setProducts(r.data.items))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category, sort, search, params]);

  function updateParam(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  }

  return (
    <div className="container-x py-12">
      <h1 className="font-display text-4xl mb-2">Catálogo</h1>
      <p className="text-espresso/60 mb-8">Lámparas y objetos de diseño para cada ambiente.</p>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <input
          placeholder="Buscar productos..."
          defaultValue={search}
          onKeyDown={(e) => e.key === 'Enter' && updateParam('search', e.target.value)}
          className="border border-sand rounded-full px-5 py-2.5 flex-1"
        />
        <select value={category} onChange={(e) => updateParam('category', e.target.value)} className="border border-sand rounded-full px-4 py-2.5">
          <option value="">Todas las categorías</option>
          {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="border border-sand rounded-full px-4 py-2.5">
          <option value="">Más recientes</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando productos...</p>
      ) : products.length === 0 ? (
        <p className="text-espresso/60">No encontramos productos con esos filtros.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
