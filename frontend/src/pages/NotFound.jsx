import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container-x py-32 text-center">
      <h1 className="font-display text-6xl mb-4">404</h1>
      <p className="text-espresso/60 mb-8">No encontramos la página que buscás.</p>
      <Link to="/" className="btn-primary">Volver al inicio</Link>
    </div>
  );
}
