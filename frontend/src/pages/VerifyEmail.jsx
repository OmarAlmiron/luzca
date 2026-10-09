import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { refreshUser } = useAuth();
  const [state, setState] = useState('loading');
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    api.post('/auth/verify-email', { token: params.get('token') || '' })
      .then(() => { setState('ok'); refreshUser?.(); })
      .catch(() => setState('error'));
  }, [params, refreshUser]);

  return (
    <div className="container-x py-24 max-w-md mx-auto text-center">
      {state === 'loading' && <p>Confirmando tu email...</p>}
      {state === 'ok' && (<>
        <h1 className="font-display text-3xl mb-4">¡Email confirmado!</h1>
        <Link to="/catalogo" className="btn-primary">Ir al catálogo</Link>
      </>)}
      {state === 'error' && (<>
        <h1 className="font-display text-3xl mb-4">El link no es válido</h1>
        <p className="text-espresso/60 mb-6">Puede que ya lo hayas usado. Si no, pedí uno nuevo desde Mi cuenta.</p>
        <Link to="/panel" className="btn-primary">Ir a Mi cuenta</Link>
      </>)}
    </div>
  );
}
