import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './States';

export function ProtectedRoute({ children }) {
  const { isAdmin, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!isAdmin) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  return children;
}
