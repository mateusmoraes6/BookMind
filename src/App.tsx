import { useState, useEffect } from 'react';
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

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'library':
        return <Library />;
      case 'genres':
        return <Genres />;
      case 'goals':
        return <Goals />;
      case 'lists':
        return <Lists />;
      case 'calendar':
        return <Calendar />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
