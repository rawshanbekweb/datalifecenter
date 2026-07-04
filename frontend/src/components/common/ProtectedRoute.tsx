import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps): React.ReactElement {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <section style={{ padding:'200px 24px 80px', textAlign:'center', color:'#94a3b8', fontSize:14 }}>Yuklanmoqda...</section>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
