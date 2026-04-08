import { useState, useEffect, useCallback } from 'react';
import { goalsService, Goal } from '../services/goalsService';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateISO, getMonthRange, getDaysInMonth } from '../lib/dateUtils';

export type Pace = 'completed' | 'ahead' | 'on_track' | 'behind';

export interface BookSummary {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  started_in_different_month: boolean;
}

export interface ProgressData {
  current: number;
  target: number;
  percentage: number;
  started?: number;
  startedList?: BookSummary[];
  completedList?: BookSummary[];
  inProgressThisMonth?: BookSummary[];
  daysRemaining?: number;
  pace?: Pace;
}

export function useGoalsData() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const calculateProgress = useCallback(async (goalList: Goal[]) => {
    if (!user) return {};
    const result: Record<string, ProgressData> = {};
    const now = new Date();

    for (const goal of goalList) {
      const target = goal.target_value;
      let pd: ProgressData = { current: 0, target, percentage: 0 };

      if (goal.goal_type === 'daily_pages') {
        const today = getLocalDateISO();
        const current = await goalsService.getPagesReadByDate(user.id, today);
        pd = { current, target, percentage: Math.min((current / target) * 100, 100) };
      } else if (goal.goal_type === 'monthly_books') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
        const totalDays = getDaysInMonth(year, month);
        const dayOfMonth = now.getDate();
        const daysRemaining = totalDays - dayOfMonth;

        const completedData = await goalsService.getCompletedBooksInRange(user.id, monthStart, monthEnd);
        const startedData = await goalsService.getStartedBooksInRange(user.id, monthStart, monthEnd);

        const completedList: BookSummary[] = (completedData || []).map((b: any) => ({
          ...b,
          started_in_different_month: b.started_at ? b.started_at < monthStart : false,
        }));

        const startedList: BookSummary[] = (startedData || []).map((b: any) => ({
          ...b,
          started_in_different_month: false,
        }));

        const inProgressThisMonth = startedList.filter(b => b.status === 'in_progress');
        const completedCount = completedList.length;

        const expectedByNow = (target / totalDays) * dayOfMonth;
        let pace: Pace;
        if (completedCount >= target) pace = 'completed';
        else if (completedCount >= expectedByNow) pace = 'ahead';
        else if (completedCount >= expectedByNow * 0.6) pace = 'on_track';
        else pace = 'behind';

        pd = {
          current: completedCount,
          target,
          percentage: Math.min((completedCount / target) * 100, 100),
          started: startedList.length,
          startedList,
          completedList,
          inProgressThisMonth,
          daysRemaining,
          pace,
        };
      } else if (goal.goal_type === 'yearly_books') {
        const year = now.getFullYear();
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        const dayOfYear = Math.floor((now.getTime() - new Date(year, 0, 0).getTime()) / 86400000);
        const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
        const daysRemaining = totalDays - dayOfYear;

        const completedData = await goalsService.getCompletedBooksInRange(user.id, yearStart, yearEnd);
        const startedData = await goalsService.getStartedBooksInRange(user.id, yearStart, yearEnd);

        const completedList: BookSummary[] = (completedData || []).map((b: any) => ({
          ...b,
          started_in_different_month: false,
        }));
        const completedCount = completedList.length;

        const expectedByNow = (target / totalDays) * dayOfYear;
        let pace: Pace;
        if (completedCount >= target) pace = 'completed';
        else if (completedCount >= expectedByNow) pace = 'ahead';
        else if (completedCount >= expectedByNow * 0.6) pace = 'on_track';
        else pace = 'behind';

        pd = {
          current: completedCount,
          target,
          percentage: Math.min((completedCount / target) * 100, 100),
          started: startedData?.length || 0,
          completedList,
          daysRemaining,
          pace,
        };
      }
      result[goal.id] = pd;
    }
    return result;
  }, [user]);

  const refresh = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const data = await goalsService.getActiveGoals(user.id);
      setGoals(data);
      const progressData = await calculateProgress(data);
      setProgress(progressData);
    } catch (err) {
      console.error('Error loading goals data:', err);
      setError(err instanceof Error ? err : 'Erro ao carregar metas');
    } finally {
      setLoading(false);
    }
  }, [user, calculateProgress]);

  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  return {
    goals,
    progress,
    loading,
    error,
    empty: goals.length === 0,
    refresh
  };
}
