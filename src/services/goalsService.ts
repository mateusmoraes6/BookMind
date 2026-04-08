import { supabase } from '../lib/supabase';

export interface Goal {
  id: string;
  user_id: string;
  goal_type: 'daily_pages' | 'monthly_books' | 'yearly_books';
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
}

export const goalsService = {
  /**
   * Fetches all active goals for a user.
   */
  async getActiveGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await (supabase.from('reading_goals') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching active goals:', error);
      throw error;
    }
    return data as Goal[];
  },

  /**
   * Creates a new goal.
   */
  async createGoal(goal: Omit<Goal, 'id' | 'created_at'>): Promise<void> {
    const { error } = await (supabase.from('reading_goals') as any)
      .insert(goal);

    if (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  /**
   * Updates an existing goal.
   */
  async updateGoal(goalId: string, goal: Partial<Goal>): Promise<void> {
    const { error } = await (supabase.from('reading_goals') as any)
      .update(goal)
      .eq('id', goalId);

    if (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  /**
   * Deactivates a goal.
   */
  async deactivateGoal(goalId: string): Promise<void> {
    const { error } = await (supabase.from('reading_goals') as any)
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) {
      console.error('Error deactivating goal:', error);
      throw error;
    }
  },

  /**
   * Fetches pages read for a specific day.
   */
  async getPagesReadByDate(userId: string, date: string): Promise<number> {
    const { data, error } = await (supabase.from('reading_sessions') as any)
      .select('pages_read')
      .eq('user_id', userId)
      .eq('session_date', date);

    if (error) {
      console.error('Error fetching pages read:', error);
      throw error;
    }

    return (data as any[])?.reduce((sum, r) => sum + (r.pages_read || 0), 0) || 0;
  },

  /**
   * Fetches completed books within a date range.
   */
  async getCompletedBooksInRange(userId: string, start: string, end: string) {
    const { data, error } = await (supabase.from('books') as any)
      .select('id, title, author, cover_url, total_pages, current_page, started_at, completed_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .gte('completed_at', start)
      .lte('completed_at', end);

    if (error) {
      console.error('Error fetching completed books in range:', error);
      throw error;
    }

    return data;
  },

  /**
   * Fetches books that were started (have started_at) within a date range.
   */
  async getStartedBooksInRange(userId: string, start: string, end: string) {
    const { data, error } = await (supabase.from('books') as any)
      .select('id, title, author, cover_url, total_pages, current_page, started_at, completed_at, status')
      .eq('user_id', userId)
      .not('started_at', 'is', null)
      .gte('started_at', start)
      .lte('started_at', end);

    if (error) {
      console.error('Error fetching started books in range:', error);
      throw error;
    }

    return data;
  }
};
