import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import type { Database } from './lib/database.types';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Library from './components/Library';
import Genres from './components/Genres';
import Goals from './components/Goals';
import Lists from './components/Lists';
import Calendar from './components/Calendar';
import Settings from './components/Settings';
import { InstallPWA } from './components/InstallPWA';
import { ToastProvider } from './contexts/ToastContext';


function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    // Aplicar tema dark como padrão ao carregar
    document.documentElement.classList.add('dark');

    if (user) {
      // Carregar preferências do usuário, se existirem
      type UserPreferencesRow = Database['public']['Tables']['user_preferences']['Row'];

      supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) {
            // Se não houver registro, não é um erro crítico
            if (error.code !== 'PGRST116') {
              console.error('Error loading theme:', error);
            }
            // Se houver erro ou não houver dados, mantém o tema dark padrão
            return;
          }

          // Se houver preferência salva, aplicar o tema escolhido
          const preferences = data as UserPreferencesRow | null;
          if (preferences && preferences.theme) {
            if (preferences.theme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
          }
          // Se não houver preferência, mantém dark (já aplicado acima)
        });
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-cream-100"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<Library />} />
        <Route path="/genres" element={<Genres />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/lists" element={<Lists />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <InstallPWA />
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
