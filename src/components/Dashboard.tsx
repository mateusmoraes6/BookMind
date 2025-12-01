import { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, Target, Award, BookMarked, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalBooks: number;
  booksInProgress: number;
  booksCompleted: number;
  pagesReadToday: number;
  currentStreak: number;
  thisMonthBooks: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    booksInProgress: 0,
    booksCompleted: 0,
    pagesReadToday: 0,
    currentStreak: 0,
    thisMonthBooks: 0,
  });
  const [recentBooks, setRecentBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const [booksData, sessionsData] = await Promise.all([
      supabase
        .from('books')
        .select('*, genres(name, color)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      supabase
        .from('reading_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false }),
    ]);

    if (booksData.data) {
      const total = booksData.data.length;
      const inProgress = booksData.data.filter(b => b.status === 'in_progress').length;
      const completed = booksData.data.filter(b => b.status === 'completed').length;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = booksData.data.filter(
        b => b.completed_at && new Date(b.completed_at) >= startOfMonth
      ).length;

      setStats(prev => ({
        ...prev,
        totalBooks: total,
        booksInProgress: inProgress,
        booksCompleted: completed,
        thisMonthBooks: thisMonth,
      }));

      setRecentBooks(booksData.data.slice(0, 6));
    }

    if (sessionsData.data) {
      const today = new Date().toISOString().split('T')[0];
      const todayPages = sessionsData.data
        .filter(s => s.session_date === today)
        .reduce((sum, s) => sum + (s.pages_read || 0), 0);

      const streak = calculateStreak(sessionsData.data);

      setStats(prev => ({
        ...prev,
        pagesReadToday: todayPages,
        currentStreak: streak,
      }));
    }

    setLoading(false);
  };

  const calculateStreak = (sessions: any[]) => {
    if (sessions.length === 0) return 0;

    const dates = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < dates.length; i++) {
      const sessionDate = new Date(dates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (sessionDate.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const statCards = [
    { label: 'Total de Livros', value: stats.totalBooks, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Em Andamento', value: stats.booksInProgress, icon: BookMarked, color: 'bg-amber-500' },
    { label: 'Concluídos', value: stats.booksCompleted, icon: Award, color: 'bg-green-500' },
    { label: 'Páginas Hoje', value: stats.pagesReadToday, icon: TrendingUp, color: 'bg-purple-500' },
    { label: 'Sequência Atual', value: `${stats.currentStreak} dias`, icon: Target, color: 'bg-red-500' },
    { label: 'Este Mês', value: stats.thisMonthBooks, icon: Clock, color: 'bg-cyan-500' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-2">Visão geral das suas leituras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 font-medium">{card.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Livros Recentes</h2>
        </div>
        <div className="p-6">
          {recentBooks.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">Nenhum livro cadastrado ainda</p>
              <p className="text-sm text-slate-500 mt-1">Comece adicionando seus livros à biblioteca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBooks.map((book) => (
                <div key={book.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex gap-3">
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-16 h-24 object-cover rounded" />
                    ) : (
                      <div className="w-16 h-24 bg-slate-200 rounded flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 truncate">{book.title}</h3>
                      <p className="text-sm text-slate-600 truncate">{book.author}</p>
                      {book.genres && (
                        <span
                          className="inline-block text-xs px-2 py-1 rounded mt-2"
                          style={{ backgroundColor: `${book.genres.color}20`, color: book.genres.color }}
                        >
                          {book.genres.name}
                        </span>
                      )}
                      {book.status === 'in_progress' && book.total_pages > 0 && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-slate-600 mb-1">
                            <span>{book.current_page} páginas</span>
                            <span>{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                          </div>
                          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-900 transition-all"
                              style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
