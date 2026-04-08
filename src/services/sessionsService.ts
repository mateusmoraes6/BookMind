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
  }
};
