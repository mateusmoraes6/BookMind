import { supabase } from '../lib/supabase';
import { Book } from '../types/book';

export const booksService = {
  /**
   * Fetches all books for a specific user, including their genre info.
   */
  async getBooksByUserId(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*, genres(id, name, color)')
      .eq('user_id', userId)
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
    
    return (data as any) as Book[];
  },

  /**
   * Fetches books for the dashboard, ordered by last update.
   */
  async getRecentBooksByUserId(userId: string): Promise<Book[]> {
    const { data, error } = await supabase
      .from('books')
      .select('*, genres(name, color)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent books:', error);
      throw error;
    }
    
    return (data as any) as Book[];
  },

  /**
   * Fetches all genres for a specific user.
   */
  async getGenresByUserId(userId: string) {
    const { data, error } = await supabase
      .from('genres')
      .select('*')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      console.error('Error fetching genres:', error);
      throw error;
    }

    return data;
  },

  /**
   * Deletes a book by its ID.
   */
  async deleteBook(bookId: string): Promise<void> {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', bookId);

    if (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }
};
