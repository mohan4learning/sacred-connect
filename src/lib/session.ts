// Simple session management using localStorage (MVP - no auth)

export type UserRole = 'client' | 'purohit';

export interface Session {
  role: UserRole;
  profileId: string;
  profileName: string;
}

const SESSION_KEY = 'purohit_connect_session';

export function getSession(): Session | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as Session;
  } catch {
    return null;
  }
}

export function setSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function isClient(session: Session | null): boolean {
  return session?.role === 'client';
}

export function isPurohit(session: Session | null): boolean {
  return session?.role === 'purohit';
}
