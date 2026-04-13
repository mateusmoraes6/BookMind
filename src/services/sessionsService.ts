import { supabase } from '../lib/supabase';
import { getLocalISOString } from '../lib/dateUtils';

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
  },

  /**
   * Updates a reading session and recalculates book progress.
   */
  async updateSession(sessionId: string, data: Partial<ReadingSession>): Promise<ReadingSession> {
    const { data: updatedSession, error } = await (supabase
      .from('reading_sessions') as any)
      .update(data)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }

    await this.recalculateBookProgress(updatedSession.book_id);
    return updatedSession as ReadingSession;
  },

  /**
   * Deletes a reading session and recalculates book progress.
   */
  async deleteSession(sessionId: string): Promise<void> {
    const { data: session, error: fetchError } = await (supabase
      .from('reading_sessions') as any)
      .select('book_id')
      .eq('id', sessionId)
      .single();

    if (fetchError) {
      console.error('Error fetching session before deletion:', fetchError);
      throw fetchError;
    }

    const { error: deleteError } = await (supabase
      .from('reading_sessions') as any)
      .delete()
      .eq('id', sessionId);

    if (deleteError) {
      console.error('Error deleting session:', deleteError);
      throw deleteError;
    }

    await this.recalculateBookProgress(session.book_id);
  },

  /**
   * Recalculates current_page and status for a book based on its sessions.
   */
  async recalculateBookProgress(bookId: string): Promise<void> {
    const { data: sessions, error: sessionsError } = await (supabase
      .from('reading_sessions') as any)
      .select('pages_read')
      .eq('book_id', bookId);

    if (sessionsError) throw sessionsError;

    const { data: book, error: bookError } = await (supabase
      .from('books') as any)
      .select('*')
      .eq('id', bookId)
      .single();

    if (bookError) throw bookError;

    const totalPagesRead = (sessions || []).reduce((sum, s) => sum + (s.pages_read || 0), 0);
    const isCompleted = totalPagesRead >= book.total_pages && book.total_pages > 0;
    
    let newStatus = book.status;
    if (isCompleted) {
      newStatus = 'completed';
    } else if (totalPagesRead > 0) {
      if (book.status === 'completed' || book.status === 'not_started' || book.status === 'want_to_read') {
        newStatus = 'in_progress';
      }
    } else {
      if (book.status === 'in_progress' || book.status === 'completed') {
        newStatus = 'not_started';
      }
    }

    await (supabase
      .from('books') as any)
      .update({
        current_page: totalPagesRead,
        status: newStatus,
        completed_at: isCompleted ? (book.completed_at || getLocalISOString()) : null,
        updated_at: getLocalISOString()
      })
      .eq('id', bookId);
  }
};
