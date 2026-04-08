import { supabase } from '../lib/supabase';

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  pages_read: number;
  session_date: string;
  duration_minutes: number;
  notes: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  goal_type: string;
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
}

export const sessionsService = {
  /**
   * Fetches all reading sessions for a specific user.
   */
  async getSessionsByUserId(userId: string): Promise<ReadingSession[]> {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }
    
    return data as ReadingSession[];
  },

  /**
   * Fetches all active goals for a specific user.
   */
  async getActiveGoalsByUserId(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }

    return data as Goal[];
  }
};
