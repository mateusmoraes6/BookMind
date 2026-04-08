import { useState, useEffect } from 'react';
import { BookOpen, LayoutDashboard, Library as LibraryIcon, Tag, Target, List, Calendar as CalendarIcon, LogOut, Settings as SettingsIcon, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Layout({ children, activeView, onViewChange }: LayoutProps) {
  const { signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'library', label: 'Biblioteca', icon: LibraryIcon },
    { id: 'genres', label: 'Gêneros', icon: Tag },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'lists', label: 'Listas', icon: List },
    { id: 'calendar', label: 'Calendário', icon: CalendarIcon },
  ];

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 dark:bg-dark-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-30 shadow-lg">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-white hover:bg-white/10 rounded-xl transition-all focus-visible:ring-offset-slate-900"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg transition-colors">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg text-white tracking-tight">BookMind</span>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`fixed md:fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-950 border-r border-slate-200 dark:border-dark-800 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-dark-800 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 dark:bg-cream-100 p-2.5 rounded-xl shadow-lg transition-colors">
              <BookOpen className="w-6 h-6 text-white dark:text-dark-950" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-cream-100 tracking-tight">BookMind</h1>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/40 tracking-widest">Leituras</p>
            </div>
          </div>
        </div>

        <div className="md:hidden p-6 flex items-center justify-between border-b border-slate-200 dark:border-dark-800">
          <span className="text-[10px] uppercase font-black text-slate-400 dark:text-cream-200/20 tracking-widest">Navegação</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 dark:text-cream-200/40 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-all"
            aria-label="Fachar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isActive
                  ? 'bg-slate-900 dark:bg-cream-100 text-white dark:text-dark-950 shadow-xl shadow-black/20 font-bold'
                  : 'text-slate-600 dark:text-cream-200/60 hover:bg-slate-100 dark:hover:bg-dark-800 font-medium'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white dark:text-dark-950' : 'text-slate-400 dark:text-cream-200/30'}`} />
                <span className="tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-dark-800 space-y-2">
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeView === 'settings'
              ? 'bg-slate-900 dark:bg-cream-100 text-white dark:text-dark-950 shadow-xl shadow-black/20 font-bold'
              : 'text-slate-600 dark:text-cream-200/60 hover:bg-slate-100 dark:hover:bg-dark-800 font-medium'
              }`}
            aria-current={activeView === 'settings' ? 'page' : undefined}
          >
            <SettingsIcon className={`w-5 h-5 ${activeView === 'settings' ? 'text-white dark:text-dark-950' : 'text-slate-400 dark:text-cream-200/30'}`} />
            <span className="tracking-tight">Configurações</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-bold"
            aria-label="Sair da conta"
          >
            <LogOut className="w-5 h-5" />
            <span className="tracking-tight">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 transition-all duration-300 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}
