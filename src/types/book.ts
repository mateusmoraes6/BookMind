import { BookMarked, CheckCircle2, Clock, Star, PauseCircle } from 'lucide-react';

export type BookStatus = 'not_started' | 'want_to_read' | 'in_progress' | 'completed' | 'paused';

export interface BookStatusMeta {
  id: BookStatus;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  icon: any;
  order: number;
}

export const BOOK_STATUS_METADATA: Record<BookStatus, BookStatusMeta> = {
  in_progress: {
    id: 'in_progress',
    label: 'Lendo',
    color: '#f59e0b', // amber-500
    bgClass: 'bg-amber-100/80 dark:bg-amber-500/10',
    textClass: 'text-amber-700 dark:text-amber-400',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
    icon: BookMarked,
    order: 1,
  },
  paused: {
    id: 'paused',
    label: 'Pausado',
    color: '#64748b', // slate-500
    bgClass: 'bg-slate-100 dark:bg-slate-500/10',
    textClass: 'text-slate-700 dark:text-slate-400',
    borderClass: 'border-slate-200 dark:border-slate-500/30',
    icon: PauseCircle,
    order: 2,
  },
  not_started: {
    id: 'not_started',
    label: 'Na Fila',
    color: '#94a3b8', // slate-400
    bgClass: 'bg-slate-50 dark:bg-dark-800',
    textClass: 'text-slate-500 dark:text-cream-200/40',
    borderClass: 'border-slate-200 dark:border-dark-800',
    icon: Clock,
    order: 3,
  },
  want_to_read: {
    id: 'want_to_read',
    label: 'Quero Ler',
    color: '#0ea5e9', // sky-500
    bgClass: 'bg-sky-100/80 dark:bg-sky-500/10',
    textClass: 'text-sky-700 dark:text-sky-400',
    borderClass: 'border-sky-200 dark:border-sky-500/30',
    icon: Star,
    order: 4,
  },
  completed: {
    id: 'completed',
    label: 'Concluído',
    color: '#10b981', // emerald-500
    bgClass: 'bg-emerald-100/80 dark:bg-emerald-500/10',
    textClass: 'text-emerald-700 dark:text-emerald-400',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
    icon: CheckCircle2,
    order: 5,
  },
};

export const BOOK_STATUS_LIST = Object.values(BOOK_STATUS_METADATA).sort((a, b) => a.order - b.order);

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  publication_year: number | null;
  genre_id: string | null;
  total_pages: number;
  cover_url: string | null;
  isbn: string | null;
  description: string | null;
  status: BookStatus;
  personal_rating: number | null;
  current_page: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  genres?: { id: string; name: string; color: string; icon: string } | null;
}
