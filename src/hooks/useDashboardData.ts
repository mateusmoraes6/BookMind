import { useState, useEffect, useCallback } from 'react';
import { booksService } from '../services/booksService';
import { sessionsService, ReadingSession } from '../services/sessionsService';
import { goalsService, Goal } from '../services/goalsService';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateISO } from '../lib/dateUtils';
import { Book } from '../types/book';

export interface DashboardStats {
  totalBooks: number;
  booksInProgress: number;
  booksCompleted: number;
  booksPaused: number;
  booksWantToRead: number;
  pagesReadToday: number;
  currentStreak: number;
  thisMonthBooks: number;
  totalPagesRead: number;
}

export function useDashboardData() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    booksInProgress: 0,
    booksCompleted: 0,
    booksPaused: 0,
    booksWantToRead: 0,
    pagesReadToday: 0,
    currentStreak: 0,
    thisMonthBooks: 0,
    totalPagesRead: 0,
  });
  const [currentBooks, setCurrentBooks] = useState<Book[]>([]);
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [last7Days, setLast7Days] = useState<{ date: string; pages: number }[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const calculateStreak = (sessions: ReadingSession[]) => {
    if (sessions.length === 0) return 0;
    const dates = [...new Set(sessions.map((s) => s.session_date))].sort().reverse();
    const today = new Date();
    const todayStr = getLocalDateISO(today);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = getLocalDateISO(yesterday);

    if (dates[0] !== todayStr && dates[0] !== yesterdayStr) return 0;

    let streak = 0;
    for (let i = 0; i < dates.length; i++) {
      const expectedDate = new Date(dates[0] === todayStr ? today : yesterday);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (dates[i] === getLocalDateISO(expectedDate)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const refresh = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [books, sessions, goals] = await Promise.all([
        booksService.getRecentBooksByUserId(user.id),
        sessionsService.getSessionsByUserId(user.id),
        goalsService.getActiveGoals(user.id)
      ]);

      if (books) {
        setAllBooks(books);
        const total = books.length;
        const inProgressBooks = books.filter((b) => b.status === 'in_progress');
        const completedCount = books.filter((b) => b.status === 'completed').length;
        const pausedCount = books.filter((b) => b.status === 'paused').length;
        const wantToReadCount = books.filter((b) => b.status === 'want_to_read').length;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonth = books.filter(
          (b) => b.completed_at && new Date(b.completed_at) >= startOfMonth
        ).length;

        const sorted = [...inProgressBooks].sort(
          (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setCurrentBooks(sorted);

        const heroIds = new Set(sorted.map((b) => b.id));
        setRecentBooks(books.filter((b) => !heroIds.has(b.id)).slice(0, 6));

        setStats((prev) => ({
          ...prev,
          totalBooks: total,
          booksInProgress: inProgressBooks.length,
          booksCompleted: completedCount,
          booksPaused: pausedCount,
          booksWantToRead: wantToReadCount,
          thisMonthBooks: thisMonth,
        }));
      }

      if (sessions) {
        const today = getLocalDateISO();
        const todayPages = sessions
          .filter((s) => s.session_date === today)
          .reduce((sum, s) => sum + (s.pages_read || 0), 0);

        const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
        const streak = calculateStreak(sessions as any);

        const days: { date: string; pages: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = getLocalDateISO(d);
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

      if (goals) {
        setActiveGoals(goals as any);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err : 'Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  return {
    stats,
    currentBooks,
    recentBooks,
    allBooks,
    last7Days,
    activeGoals,
    loading,
    error,
    empty: stats.totalBooks === 0,
    refresh
  };
}
