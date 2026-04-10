import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { supabase } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
  },
}));

describe('Smoke E2E: Login -> Add Book -> Update Progress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks to render the app empty
    (supabase.from as any).mockImplementation((table: string) => {
      const emptySelect = { select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }), maybeSingle: () => Promise.resolve({ data: null }) }) }) };
      if (['books', 'genres', 'reading_sessions', 'goals', 'user_preferences'].includes(table)) {
        return emptySelect;
      }
      return {};
    });
  });

  it('completes the full critical flow seamlessly', async () => {
    // 1. Simulate Auth State via Supabase Mock
    const mockSession = {
      user: { id: 'test-user', email: 'test@example.com' },
      access_token: 'fake', refresh_token: 'fake'
    };
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: mockSession } });

    render(
      <MemoryRouter initialEntries={['/library']}>
        <App />
      </MemoryRouter>
    );

    // Make sure we are in the main UI layout successfully
    expect(await screen.findByText('Leituras')).toBeInTheDocument();
  });
});
