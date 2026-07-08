import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { roleHome } from '../../utils/roleHome';

// Eski /dashboard kabi umumiy yo'llarni rolga mos kabinetga yo'naltiradi.
// Kirmagan foydalanuvchi /student'ga tushadi — u yerdagi ProtectedRoute login'ga olib boradi.
export default function RoleHomeRedirect(): React.ReactElement | null {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={roleHome(user?.role)} replace />;
}
