import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'client' | 'purohit';

interface Profile {
  id: string;
  role: AppRole;
  full_name: string;
  phone?: string;
  email?: string;
}

interface ClientRecord {
  id: string;
  user_id: string;
  full_name: string;
  city: string;
  area?: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface PurohitRecord {
  id: string;
  user_id: string;
  full_name: string;
  city: string;
  area?: string;
  email?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  clientRecord: ClientRecord | null;
  purohitRecord: PurohitRecord | null;
  loading: boolean;
  needsRoleSelection: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  selectRole: (role: 'client' | 'purohit', fullName: string, city: string) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
  isClient: boolean;
  isPurohit: boolean;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [clientRecord, setClientRecord] = useState<ClientRecord | null>(null);
  const [purohitRecord, setPurohitRecord] = useState<PurohitRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsRoleSelection, setNeedsRoleSelection] = useState(false);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return null;
      }

      if (profileData) {
        const typedProfile: Profile = {
          id: profileData.id,
          role: profileData.role as AppRole,
          full_name: profileData.full_name,
          phone: profileData.phone || undefined,
          email: profileData.email || undefined,
        };
        setProfile(typedProfile);
        setNeedsRoleSelection(false);

        // Fetch related record based on role
        if (typedProfile.role === 'client') {
          const { data: clientData } = await supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (clientData) {
            setClientRecord(clientData as ClientRecord);
          }
        } else if (typedProfile.role === 'purohit') {
          const { data: purohitData } = await supabase
            .from('purohits')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          if (purohitData) {
            setPurohitRecord(purohitData as PurohitRecord);
          }
        }

        return typedProfile;
      } else {
        // No profile exists - user needs to select role
        setNeedsRoleSelection(true);
        return null;
      }
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  };

  const refetchProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer profile fetch to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchProfile(currentSession.user.id).finally(() => {
              setLoading(false);
            });
          }, 0);
        } else {
          setProfile(null);
          setClientRecord(null);
          setPurohitRecord(null);
          setNeedsRoleSelection(false);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchProfile(existingSession.user.id).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
    return { error: error as Error | null };
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUpWithEmail = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setClientRecord(null);
    setPurohitRecord(null);
    setNeedsRoleSelection(false);
  };

  const selectRole = async (role: 'client' | 'purohit', fullName: string, city: string) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          role: role,
          full_name: fullName,
          email: user.email,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        return { error: new Error(profileError.message) };
      }

      // Create role-specific record
      if (role === 'client') {
        const { error: clientError } = await supabase
          .from('clients')
          .insert({
            user_id: user.id,
            full_name: fullName,
            city: city,
            email: user.email,
          });

        if (clientError) {
          console.error('Client creation error:', clientError);
          return { error: new Error(clientError.message) };
        }
      } else if (role === 'purohit') {
        // Insert into purohits table (no email - it goes to purohit_private)
        const { data: purohitData, error: purohitError } = await supabase
          .from('purohits')
          .insert({
            user_id: user.id,
            full_name: fullName,
            city: city,
          })
          .select()
          .single();

        if (purohitError) {
          console.error('Purohit creation error:', purohitError);
          return { error: new Error(purohitError.message) };
        }

        // Insert email into purohit_private table
        if (purohitData) {
          const { error: privateError } = await supabase
            .from('purohit_private')
            .insert({
              purohit_id: purohitData.id,
              email: user.email,
            });

          if (privateError) {
            console.error('Purohit private data error:', privateError);
            // Non-fatal error, continue
          }
        }
      }

      // Refetch profile
      await fetchProfile(user.id);
      return { error: null };
    } catch (err) {
      console.error('Error in selectRole:', err);
      return { error: err as Error };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    clientRecord,
    purohitRecord,
    loading,
    needsRoleSelection,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    selectRole,
    isAdmin: profile?.role === 'admin',
    isClient: profile?.role === 'client',
    isPurohit: profile?.role === 'purohit',
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
