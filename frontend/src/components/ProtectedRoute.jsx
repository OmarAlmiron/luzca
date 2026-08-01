import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="container-x py-24 text-center">Cargando...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
