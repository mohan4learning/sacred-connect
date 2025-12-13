import { useState, useEffect, useCallback } from 'react';
import { Session, getSession, setSession as saveSession, clearSession as removeSession } from '@/lib/session';

export function useSession() {
  const [session, setSessionState] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedSession = getSession();
    setSessionState(storedSession);
    setLoading(false);
  }, []);

  const login = useCallback((newSession: Session) => {
    saveSession(newSession);
    setSessionState(newSession);
  }, []);

  const logout = useCallback(() => {
    removeSession();
    setSessionState(null);
  }, []);

  return {
    session,
    loading,
    login,
    logout,
    isLoggedIn: !!session,
    isClient: session?.role === 'client',
    isPurohit: session?.role === 'purohit',
  };
}
