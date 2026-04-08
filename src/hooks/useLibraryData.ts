import { useState, useEffect, useCallback } from 'react';
import { booksService } from '../services/booksService';
import { useAuth } from '../contexts/AuthContext';
import { Book } from '../types/book';

export interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export function useLibraryData() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | string | null>(null);

  const refresh = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      const [allBooks, allGenres] = await Promise.all([
        booksService.getBooksByUserId(user.id),
        booksService.getGenresByUserId(user.id)
      ]);

      setBooks(allBooks);
      setGenres(allGenres as any);
    } catch (err) {
      console.error('Error loading library data:', err);
      setError(err instanceof Error ? err : 'Erro ao carregar dados da biblioteca');
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
    books,
    genres,
    loading,
    error,
    empty: books.length === 0,
    refresh
  };
}
