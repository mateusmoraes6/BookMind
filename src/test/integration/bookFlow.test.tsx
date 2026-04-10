import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookModal from '../../components/BookModal';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../contexts/ToastContext', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('Book Integration Flow (Create, Edit)', () => {
  const mockUser = { id: 'test-user-123' };
  const mockToast = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useToast as any).mockReturnValue({ toast: mockToast });

    // Ensure getGenres returns empty string to prevent failure
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'genres') {
        return { select: () => ({ order: () => Promise.resolve({ data: [] }) }) };
      }
      return {};
    });
  });

  it('should allow creating a new book', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'books') return { insert: mockInsert };
      if (table === 'genres') return { select: () => ({ order: () => Promise.resolve({ data: [] }) }) };
      return {};
    });

    const handleClose = vi.fn();
    render(<BookModal onClose={handleClose} />);

    // Fill form
    fireEvent.change(screen.getByLabelText(/Título \*/i), { target: { value: 'The Hobbit' } });
    fireEvent.change(screen.getByLabelText(/Autor \*/i), { target: { value: 'J.R.R. Tolkien' } });
    fireEvent.change(screen.getByLabelText(/Total de Páginas/i), { target: { value: '310' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Salvar Livro/i }));

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          title: 'The Hobbit',
          author: 'J.R.R. Tolkien',
          total_pages: 310,
          user_id: mockUser.id,
        })
      ]);
      expect(mockToast).toHaveBeenCalledWith('Livro adicionado com sucesso!', 'success');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should allow editing an existing book', async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'books') return { update: mockUpdate };
      if (table === 'genres') return { select: () => ({ order: () => Promise.resolve({ data: [] }) }) };
      return {};
    });

    const handleClose = vi.fn();
    const existingBook: any = {
      id: 'book-1',
      title: 'Dune',
      author: 'Frank Herbert',
      status: 'in_progress',
      total_pages: 500,
      current_page: 100,
    };

    render(<BookModal book={existingBook} onClose={handleClose} />);

    // Modify progress
    fireEvent.change(screen.getByLabelText(/Página Atual/i), { target: { value: '150' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Salvar Livro/i }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Dune',
          current_page: 150,
        })
      );
      expect(mockToast).toHaveBeenCalledWith('Livro atualizado com sucesso!', 'success');
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });
});
