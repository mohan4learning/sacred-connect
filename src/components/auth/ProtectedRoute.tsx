import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'client' | 'purohit')[];
  requireAuth?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requireAuth = true 
}: ProtectedRouteProps) {
  const { user, profile, loading, needsRoleSelection } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    if (requireAuth && !user) {
      // Not logged in, redirect to auth
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }

    if (user && needsRoleSelection) {
      // User needs to select role first
      navigate('/select-role');
      return;
    }

    if (user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
      // User doesn't have required role
      if (profile.role === 'admin') {
        navigate('/admin');
      } else if (profile.role === 'purohit') {
        navigate('/purohit');
      } else {
        navigate('/client');
      }
      return;
    }
  }, [loading, user, profile, needsRoleSelection, requireAuth, allowedRoles, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (requireAuth && !user) {
    return null;
  }

  if (user && needsRoleSelection) {
    return null;
  }

  if (user && profile && allowedRoles && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
