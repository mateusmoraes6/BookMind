import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profile) {
            await supabase.from('profiles').insert({
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.user_metadata.full_name || null,
            });

            await initializeDefaultGenres(session.user.id);
          }
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function initializeDefaultGenres(userId: string) {
  const defaultGenres = [
    { name: 'Fantasia', color: '#8b5cf6', icon: 'wand-2' },
    { name: 'Ficção Científica', color: '#3b82f6', icon: 'rocket' },
    { name: 'Romance', color: '#ec4899', icon: 'heart' },
    { name: 'Terror', color: '#ef4444', icon: 'skull' },
    { name: 'Suspense', color: '#f59e0b', icon: 'eye' },
    { name: 'Autoajuda', color: '#10b981', icon: 'lightbulb' },
    { name: 'Biografia', color: '#6366f1', icon: 'user' },
    { name: 'Programação', color: '#06b6d4', icon: 'code' },
    { name: 'Negócios', color: '#14b8a6', icon: 'briefcase' },
    { name: 'Filosofia', color: '#a855f7', icon: 'brain' },
  ];

  await supabase.from('genres').insert(
    defaultGenres.map(genre => ({
      ...genre,
      user_id: userId,
      is_default: true,
    }))
  );
}
