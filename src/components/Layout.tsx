import { useState } from 'react';
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
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-800 sticky top-0 z-30">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-slate-900 dark:bg-cream-100 p-1.5 rounded-lg transition-colors">
            <BookOpen className="w-5 h-5 text-white dark:text-dark-950" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-cream-100">BookMind</span>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 flex flex-col transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="p-6 border-b border-slate-200 dark:border-dark-800 hidden md:block">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 dark:bg-cream-100 p-2 rounded-lg transition-colors">
              <BookOpen className="w-6 h-6 text-white dark:text-dark-950" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-cream-100">BookMind</h1>
              <p className="text-xs text-slate-500 dark:text-cream-300/60">Gerenciador de Leituras</p>
            </div>
          </div>
        </div>

        <div className="md:hidden p-4 flex items-center justify-between border-b border-slate-200 dark:border-dark-800">
          <span className="text-sm font-medium text-slate-500 dark:text-cream-200/50">Menu</span>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-1 text-slate-500 dark:text-cream-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                  ? 'bg-slate-900 dark:bg-cream-100 text-white dark:text-dark-950 shadow-lg shadow-black/20'
                  : 'text-slate-600 dark:text-cream-200/70 hover:bg-slate-100 dark:hover:bg-dark-800'
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <button
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeView === 'settings'
              ? 'bg-slate-900 dark:bg-cream-100 text-white dark:text-dark-950 shadow-lg shadow-black/20'
              : 'text-slate-600 dark:text-cream-200/70 hover:bg-slate-100 dark:hover:bg-dark-800'
              }`}
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="font-medium">Configurações</span>
          </button>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-200">
        {children}
      </main>
    </div>
  );
}
