import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Loading from './Loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string | string[];
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps): React.ReactElement {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <section style={{ padding:'200px 24px 80px' }}><Loading center bar /></section>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
