import { describe, it, expect, vi } from 'vitest';
import { booksService } from '../../services/booksService';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Delete Book Integration', () => {
  it('should call supabase delete with the correct book ID', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'books') return { delete: mockDelete };
      return {};
    });

    const bookIdToDelete = 'a1b2c3d4-e5f6';
    await booksService.deleteBook(bookIdToDelete);

    expect(supabase.from).toHaveBeenCalledWith('books');
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockEq).toHaveBeenCalledWith('id', bookIdToDelete);
  });

  it('should throw an error if the delete operation fails', async () => {
    const mockError = new Error('Database connection failed');
    const mockEq = vi.fn().mockResolvedValue({ error: mockError });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'books') return { delete: mockDelete };
      return {};
    });

    await expect(booksService.deleteBook('failed-id')).rejects.toThrow('Database connection failed');
  });
});
