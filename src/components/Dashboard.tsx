import { useEffect, useState } from 'react';
import {
  BookOpen, TrendingUp, Target, Award, BookMarked,
  Clock, Flame, Star, Trophy, BarChart2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface DashboardStats {
  totalBooks: number;
  booksInProgress: number;
  booksCompleted: number;
  pagesReadToday: number;
  currentStreak: number;
  thisMonthBooks: number;
  totalPagesRead: number;
}

interface Book {
  id: string;
  title: string;
  author: string;
  cover_url?: string;
  status: string;
  current_page: number;
  total_pages: number;
  completed_at?: string;
  updated_at: string;
  genres?: { name: string; color: string };
  rating?: number;
}

interface ReadingSession {
  session_date: string;
  pages_read: number;
}

interface Goal {
  id: string;
  goal_type: string;
  target_value: number;
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
    totalPagesRead: 0,
  });
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [last7Days, setLast7Days] = useState<{ date: string; pages: number }[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    const [booksData, sessionsData, goalsData] = await Promise.all([
      (supabase.from('books') as any)
        .select('*, genres(name, color)')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false }),
      (supabase.from('reading_sessions') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('session_date', { ascending: false }),
      (supabase.from('reading_goals') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true),
    ]);

    if (booksData.data) {
      const books: Book[] = booksData.data;
      const total = books.length;
      const inProgressBooks = books.filter((b) => b.status === 'in_progress');
      const completed = books.filter((b) => b.status === 'completed').length;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonth = books.filter(
        (b) => b.completed_at && new Date(b.completed_at) >= startOfMonth
      ).length;

      // O livro atual = mais recentemente atualizado entre os em andamento
      const sorted = [...inProgressBooks].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      const hero = sorted[0] || null;
      setCurrentBook(hero);

      setStats((prev) => ({
        ...prev,
        totalBooks: total,
        booksInProgress: inProgressBooks.length,
        booksCompleted: completed,
        thisMonthBooks: thisMonth,
      }));

      const othersStart = hero ? books.filter((b) => b.id !== hero.id) : books;
      setRecentBooks(othersStart.slice(0, 6));
    }

    if (sessionsData.data) {
      const sessions: ReadingSession[] = sessionsData.data;
      const today = new Date().toISOString().split('T')[0];

      const todayPages = sessions
        .filter((s) => s.session_date === today)
        .reduce((sum, s) => sum + (s.pages_read || 0), 0);

      const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
      const streak = calculateStreak(sessions);

      // Últimos 7 dias
      const days: { date: string; pages: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const pages = sessions
          .filter((s) => s.session_date === dateStr)
          .reduce((sum, s) => sum + (s.pages_read || 0), 0);
        days.push({ date: dateStr, pages });
      }
      setLast7Days(days);

      setStats((prev) => ({
        ...prev,
        pagesReadToday: todayPages,
        currentStreak: streak,
        totalPagesRead,
      }));
    }

    if (goalsData.data) {
      setActiveGoals(goalsData.data);
    }

    setLoading(false);
  };

  const calculateStreak = (sessions: ReadingSession[]) => {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map((s) => s.session_date))].sort().reverse();
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < dates.length; i++) {
      const sessionDate = new Date(dates[i]);
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      if (
        sessionDate.toISOString().split('T')[0] ===
        expectedDate.toISOString().split('T')[0]
      ) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress': return 'Lendo';
      case 'completed': return 'Concluído';
      case 'want_to_read': return 'Quero Ler';
      case 'paused': return 'Pausado';
      default: return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      case 'completed':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'want_to_read':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'paused':
        return 'bg-slate-500/20 text-slate-400 border border-slate-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const statCards = [
    {
      label: 'Total de Livros',
      value: stats.totalBooks,
      icon: BookOpen,
      gradient: 'from-blue-600 to-blue-400',
      glow: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Em Andamento',
      value: stats.booksInProgress,
      icon: BookMarked,
      gradient: 'from-amber-500 to-orange-400',
      glow: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Concluídos',
      value: stats.booksCompleted,
      icon: Award,
      gradient: 'from-green-600 to-emerald-400',
      glow: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Páginas Hoje',
      value: stats.pagesReadToday,
      icon: TrendingUp,
      gradient: 'from-violet-600 to-purple-400',
      glow: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Sequência',
      value: `${stats.currentStreak}d`,
      icon: Flame,
      gradient: 'from-red-500 to-orange-400',
      glow: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Este Mês',
      value: stats.thisMonthBooks,
      icon: Clock,
      gradient: 'from-cyan-600 to-sky-400',
      glow: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Carregando...</p>
        </div>
      </div>
    );
  }

  const currentProgress =
    currentBook && currentBook.total_pages > 0
      ? Math.round((currentBook.current_page / currentBook.total_pages) * 100)
      : 0;

  const monthlyGoal = activeGoals.find((g) => g.goal_type === 'monthly_books');
  const dailyGoal = activeGoals.find((g) => g.goal_type === 'daily_pages');
  const yearlyGoal = activeGoals.find((g) => g.goal_type === 'yearly_books');

  const monthlyProgress = monthlyGoal
    ? Math.min(Math.round((stats.thisMonthBooks / monthlyGoal.target_value) * 100), 100)
    : 0;

  const dailyProgress = dailyGoal
    ? Math.min(Math.round((stats.pagesReadToday / dailyGoal.target_value) * 100), 100)
    : 0;

  const maxBarPages = Math.max(...last7Days.map((d) => d.pages), 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
          Visão geral das suas leituras
        </p>
      </div>

      {/* ── Hero: Lendo Agora ── */}
      {currentBook && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-700 p-6 shadow-2xl">
          {/* Decorações de fundo */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />

          <div className="relative flex gap-5 items-start">
            {/* Capa */}
            {currentBook.cover_url ? (
              <img
                src={currentBook.cover_url}
                alt={currentBook.title}
                className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-xl shadow-2xl flex-shrink-0 border-2 border-white/20"
              />
            ) : (
              <div className="w-20 h-28 sm:w-24 sm:h-36 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                <BookOpen className="w-8 h-8 text-white/50" />
              </div>
            )}

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-200 bg-white/10 px-2.5 py-1 rounded-full mb-3">
                📖 Lendo Agora
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">
                {currentBook.title}
              </h2>
              <p className="text-indigo-200 text-sm mt-1 truncate">{currentBook.author}</p>

              {currentBook.genres && (
                <span
                  className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-2 font-medium border"
                  style={{
                    backgroundColor: `${currentBook.genres.color}25`,
                    color: currentBook.genres.color,
                    borderColor: `${currentBook.genres.color}50`,
                  }}
                >
                  {currentBook.genres.name}
                </span>
              )}

              {/* Barra de progresso */}
              {currentBook.total_pages > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-indigo-200 mb-2">
                    <span>
                      Página {currentBook.current_page} de {currentBook.total_pages}
                    </span>
                    <span className="font-bold text-white">{currentProgress}%</span>
                  </div>
                  <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-700"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-indigo-300 mt-1.5">
                    {currentBook.total_pages - currentBook.current_page} páginas restantes
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`${card.glow} border rounded-xl p-4 hover:scale-[1.03] hover:shadow-lg transition-all duration-200 dark:bg-slate-800/60 bg-white cursor-default`}
            >
              <div
                className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${card.gradient} mb-3 shadow-sm`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white leading-none">
                {card.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-tight">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Atividade + Metas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget de Atividade — últimos 7 dias */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 shadow-sm">
                <BarChart2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm">
                  Atividade de Leitura
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Últimos 7 dias</p>
              </div>
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
                🔥 {stats.currentStreak} dias
              </div>
            )}
          </div>

          {/* Barras */}
          <div className="flex gap-2 items-end h-24">
            {last7Days.map((day, i) => {
              const barHeight =
                day.pages > 0
                  ? Math.max((day.pages / maxBarPages) * 80, 16)
                  : 6;
              const isToday = day.date === new Date().toISOString().split('T')[0];
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'short',
              });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  {day.pages > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {day.pages}p
                    </span>
                  )}
                  <div
                    title={`${day.pages} páginas`}
                    className={`w-full rounded-md transition-all duration-300 ${day.pages > 0
                        ? isToday
                          ? 'bg-gradient-to-t from-indigo-600 to-indigo-400'
                          : 'bg-gradient-to-t from-indigo-500/60 to-indigo-400/60'
                        : 'bg-slate-200 dark:bg-slate-700'
                      }`}
                    style={{ height: `${barHeight}px` }}
                  />
                  <span
                    className={`text-[10px] font-medium capitalize ${isToday
                        ? 'text-indigo-500 dark:text-indigo-400'
                        : 'text-slate-400 dark:text-slate-500'
                      }`}
                  >
                    {dayLabel.replace('.', '')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">Hoje</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              {stats.pagesReadToday > 0
                ? `${stats.pagesReadToday} páginas lidas`
                : 'Nenhuma página ainda'}
            </span>
          </div>
        </div>

        {/* Widget de Metas */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-sm">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm">Metas Ativas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Progresso atual</p>
            </div>
          </div>

          {!monthlyGoal && !dailyGoal && !yearlyGoal ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nenhuma meta ativa
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Defina metas na seção Metas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyGoal && (
                <GoalBar
                  label="Meta Diária"
                  current={stats.pagesReadToday}
                  target={dailyGoal.target_value}
                  unit="pág."
                  progress={dailyProgress}
                  colorClass="from-violet-500 to-purple-400"
                />
              )}
              {monthlyGoal && (
                <GoalBar
                  label="Meta Mensal"
                  current={stats.thisMonthBooks}
                  target={monthlyGoal.target_value}
                  unit="livros"
                  progress={monthlyProgress}
                  colorClass="from-green-500 to-emerald-400"
                />
              )}
            </div>
          )}

          {/* Totais rápidos */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 grid grid-cols-2 gap-3">
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-3">
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.totalPagesRead.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Páginas totais</p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-3">
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {stats.booksCompleted}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Concluídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Livros Recentes ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {currentBook ? 'Outros Livros' : 'Livros Recentes'}
          </h2>
        </div>

        {recentBooks.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Nenhum livro por aqui ainda
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Adicione livros à biblioteca para vê-los aqui
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBooks.map((book) => {
              const progress =
                book.total_pages > 0
                  ? Math.round((book.current_page / book.total_pages) * 100)
                  : 0;
              return (
                <div
                  key={book.id}
                  className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:shadow-md hover:border-indigo-400/40 dark:hover:border-indigo-500/40 transition-all duration-200"
                >
                  <div className="flex gap-3">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {book.author}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusStyle(book.status)}`}
                        >
                          {getStatusLabel(book.status)}
                        </span>
                        {book.genres && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                            style={{
                              backgroundColor: `${book.genres.color}20`,
                              color: book.genres.color,
                              borderColor: `${book.genres.color}40`,
                            }}
                          >
                            {book.genres.name}
                          </span>
                        )}
                      </div>

                      {/* Progresso de leitura */}
                      {book.status === 'in_progress' && book.total_pages > 0 && (
                        <div className="mt-2.5">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>
                              {book.current_page}/{book.total_pages} p.
                            </span>
                            <span className="font-bold">{progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Avaliação (livros concluídos) */}
                      {book.status === 'completed' && book.rating && (
                        <div className="flex items-center gap-0.5 mt-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < (book.rating ?? 0)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300 dark:text-slate-600'
                                }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Componente auxiliar: barra de meta ── */
function GoalBar({
  label,
  current,
  target,
  unit,
  progress,
  colorClass,
}: {
  label: string;
  current: number;
  target: number;
  unit: string;
  progress: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white">{current}</span>
          {' '}/ {target} {unit}
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-right">
        {progress >= 100 ? '🎉 Meta atingida!' : `${progress}% concluído`}
      </p>
    </div>
  );
}
