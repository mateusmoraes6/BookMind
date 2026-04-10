import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookDetailModal from '../../components/BookDetailModal';
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

describe('Reading Session Integration Flow', () => {
  const mockUser = { id: 'test-user-123' };
  const mockToast = vi.fn();
  
  const sampleBook: any = {
    id: 'book-1',
    title: 'Atomic Habits',
    author: 'James Clear',
    status: 'in_progress',
    total_pages: 320,
    current_page: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user: mockUser });
    (useToast as any).mockReturnValue({ toast: mockToast });
  });

  it('should register a reading session successfully', async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'reading_sessions') {
        return { 
          select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }),
          insert: mockInsert
        };
      }
      if (table === 'books') {
        return { update: mockUpdate };
      }
      return {};
    });

    const handleClose = vi.fn();
    const handleEdit = vi.fn();
    const handleBookUpdated = vi.fn();

    render(
      <BookDetailModal 
        book={sampleBook} 
        onClose={handleClose} 
        onEdit={handleEdit} 
        onBookUpdated={handleBookUpdated} 
      />
    );

    // Click "Registrar" to open session form
    fireEvent.click(screen.getByRole('button', { name: /Registrar Sessão/i }));

    // Fill session data
    fireEvent.change(screen.getByLabelText(/Páginas Lidas \*/i), { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/Duração \(min\) \*/i), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText(/Notas/i), { target: { value: 'Great chapter!' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Salvar Sessão/i }));

    await waitFor(() => {
      // 1. Session Inserted
      expect(mockInsert).toHaveBeenCalledTimes(1);
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          book_id: sampleBook.id,
          pages_read: 20,
          start_page: 50,
          end_page: 70, // 50 + 20
          duration_minutes: 30,
          notes: 'Great chapter!',
        })
      );

      // 2. Book Updated with new progress
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          current_page: 70,
          status: 'in_progress',
        })
      );

      // 3. User Feedback & Refresh triggered
      expect(mockToast).toHaveBeenCalledWith('Sessão registrada com sucesso!', 'success');
      expect(handleBookUpdated).toHaveBeenCalledTimes(1);
    });
  });
});
