import { useEffect, useState } from 'react';
import { X, Edit2, BookOpen, Star, Calendar, FileText, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateISO, getLocalISOString } from '../lib/dateUtils';
import { Book, BOOK_STATUS_METADATA, BookStatus } from '../types/book';
import { useToast } from '../contexts/ToastContext';

interface BookDetailModalProps {
  book: Book;
  onClose: () => void;
  onEdit: () => void;
  onBookUpdated?: () => void; // Added to replace reloads
}

export default function BookDetailModal({ book, onClose, onEdit, onBookUpdated }: BookDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<any[]>([]);

  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionData, setSessionData] = useState({
    pages_read: '',
    duration_minutes: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadBookData();

    // Accessibility: ESC to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [book.id]);

  const loadBookData = async () => {
    const { data } = await (supabase
      .from('reading_sessions') as any)
      .select('*')
      .eq('book_id', book.id)
      .order('session_date', { ascending: false });

    if (data) setSessions(data);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    const pagesRead = parseInt(sessionData.pages_read);
    const newPage = book.current_page + pagesRead;
    const today = getLocalDateISO();

    const isCompleted = newPage >= book.total_pages;
    const newStatus: BookStatus = isCompleted ? 'completed' : 'in_progress';

    try {
      await Promise.all([
        (supabase.from('reading_sessions') as any).insert({
          user_id: user.id,
          book_id: book.id,
          pages_read: pagesRead,
          start_page: book.current_page,
          end_page: newPage,
          duration_minutes: parseInt(sessionData.duration_minutes),
          notes: sessionData.notes || null,
          session_date: today,
        }),
        (supabase
          .from('books') as any)
          .update({
            current_page: newPage,
            status: newStatus,
            completed_at: isCompleted ? getLocalISOString() : book.completed_at,
            updated_at: getLocalISOString(),
            // Ensure started_at is set if it was not_started or want_to_read
            started_at: (book.status === 'not_started' || book.status === 'want_to_read') ? today : book.started_at,
          })
          .eq('id', book.id),
      ]);

      setShowAddSession(false);
      setSessionData({ pages_read: '', duration_minutes: '', notes: '' });
      await loadBookData();

      // Notify parent to refresh data instead of reloading page
      if (onBookUpdated) {
        onBookUpdated();
      }
      toast('Sessão registrada com sucesso!', 'success');
    } catch (error) {
      console.error('Error adding session:', error);
      toast('Erro ao registrar sessão', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
  const totalTimeRead = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  const statusMeta = BOOK_STATUS_METADATA[book.status as BookStatus] || BOOK_STATUS_METADATA.not_started;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div
        className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-dark-800 relative animate-in fade-in zoom-in duration-300"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <div className="sticky top-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-800 p-8 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <h2 id="detail-title" className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">Detalhes do Livro</h2>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusMeta.bgClass} ${statusMeta.textClass} border ${statusMeta.borderClass}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {statusMeta.label}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-3 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-600 dark:text-cream-200/60 hover:bg-slate-50 dark:hover:bg-dark-800 transition-all shadow-sm transform active:scale-95"
              aria-label="Editar Livro"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-600 dark:text-cream-200/60 hover:bg-slate-50 dark:hover:bg-dark-800 transition-all shadow-sm transform active:scale-95"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex flex-col md:flex-row gap-8">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-48 h-72 object-cover rounded-2xl shadow-2xl mx-auto md:mx-0 border-4 border-white dark:border-dark-800 transform hover:rotate-2 transition-transform duration-500"
              />
            ) : (
              <div className="w-48 h-72 bg-slate-100 dark:bg-dark-950 rounded-2xl flex items-center justify-center mx-auto md:mx-0 border-4 border-dashed border-slate-200 dark:border-dark-800">
                < BookOpen className="w-16 h-16 text-slate-200 dark:text-dark-800" />
              </div>
            )}

            <div className="flex-1 space-y-5 text-center md:text-left">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-cream-50 tracking-tight leading-none mb-2">{book.title}</h1>
                <p className="text-lg font-bold text-slate-500 dark:text-cream-200/40 uppercase tracking-[0.15em]">{book.author}</p>
              </div>

              {book.description && (
                <p className="text-slate-600 dark:text-cream-200/60 leading-relaxed font-medium text-sm line-clamp-4">{book.description}</p>
              )}

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {book.publication_year && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-dark-800">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-cream-200/40">{book.publication_year}</span>
                  </div>
                )}
                {book.total_pages > 0 && (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-dark-950 px-3 py-2 rounded-xl border border-slate-100 dark:border-dark-800">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-600 dark:text-cream-200/40">{book.total_pages} páginas</span>
                  </div>
                )}
                {book.personal_rating && (
                  <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-2 rounded-xl border border-amber-500/10">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-black text-amber-600 dark:text-amber-400">{book.personal_rating}/5</span>
                  </div>
                )}
              </div>

              {(book.status === 'in_progress' || book.status === 'completed' || book.status === 'paused') && book.total_pages > 0 && (
                <div className="pt-4">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-cream-200/20 mb-3">
                    <span>Progresso: {book.current_page} de {book.total_pages}</span>
                    <span className="text-slate-900 dark:text-cream-100">{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-950 rounded-full overflow-hidden border border-slate-200 dark:border-dark-800">
                    <div
                      className="h-full bg-cream-100 shadow-[0_0_15px_rgba(245,245,244,0.4)] transition-all duration-1000"
                      style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-dark-950 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-cream-100/10 transition-colors" />
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-cream-200/20 mb-3 relative z-10">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Lido</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10 leading-none">{totalPagesRead} <span className="text-sm font-bold opacity-30 text-slate-500">pág</span></p>
            </div>

            <div className="bg-white dark:bg-dark-950 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-cream-100/10 transition-colors" />
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-cream-200/20 mb-3 relative z-10">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sessões</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10 leading-none">{sessions.length}</p>
            </div>

            <div className="bg-white dark:bg-dark-950 rounded-3xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-cream-100/10 transition-colors" />
              <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-cream-200/20 mb-3 relative z-10">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Tempo</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10 leading-none">{Math.round(totalTimeRead / 60)}<span className="text-sm font-bold opacity-30 text-slate-500">h</span> {totalTimeRead % 60}<span className="text-sm font-bold opacity-30 text-slate-500">m</span></p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-900 dark:bg-cream-100 rounded-xl shadow-lg">
                  <BookOpen className="w-4 h-4 text-white dark:text-dark-950" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-cream-50 tracking-tight">Sessões de Leitura</h3>
              </div>
              {(book.status === 'in_progress' || book.status === 'not_started' || book.status === 'want_to_read' || book.status === 'paused') && (
                <button
                  onClick={() => setShowAddSession(!showAddSession)}
                  className="flex items-center gap-2 px-6 py-3 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transform active:scale-95"
                  aria-label="Registrar Sessão"
                >
                  <Plus className="w-4 h-4" />
                  Registrar
                </button>
              )}
            </div>

            {showAddSession && (
              <form onSubmit={handleAddSession} className="bg-slate-50 dark:bg-dark-950 rounded-[2.5rem] p-8 border border-slate-200 dark:border-dark-800 space-y-6 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="pages_read" className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3 ml-1">
                      Páginas Lidas *
                    </label>
                    <input
                      id="pages_read"
                      type="number"
                      value={sessionData.pages_read}
                      onChange={(e) => setSessionData({ ...sessionData, pages_read: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black text-xl transition-all"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label htmlFor="duration_minutes" className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3 ml-1">
                      Duração (min) *
                    </label>
                    <input
                      id="duration_minutes"
                      type="number"
                      value={sessionData.duration_minutes}
                      onChange={(e) => setSessionData({ ...sessionData, duration_minutes: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black text-xl transition-all"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="notes" className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3 ml-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    id="notes"
                    value={sessionData.notes}
                    onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                    className="w-full px-5 py-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSession(false)}
                    className="flex-1 px-6 py-5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-600 dark:text-cream-200/40 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-800 transition-all font-black text-xs uppercase tracking-widest transform active:scale-95"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-6 py-5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/40 disabled:opacity-50 transform active:scale-95"
                  >
                    {isSaving ? 'Salvando...' : 'Salvar Sessão'}
                  </button>
                </div>
              </form>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-950 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-dark-800">
                <TrendingUp className="w-12 h-12 text-slate-200 dark:text-dark-800 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-cream-200/20 font-bold uppercase tracking-widest text-[10px]">
                  Nenhuma sessão registrada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-white dark:bg-dark-950 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-dark-900 flex items-center justify-center border border-slate-100 dark:border-dark-800">
                          <TrendingUp className="w-5 h-5 text-slate-400 dark:text-cream-200/20" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-cream-50 leading-tight">
                            {session.pages_read} <span className="text-xs font-bold opacity-30 uppercase tracking-widest ml-1">páginas</span>
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 dark:text-cream-200/20 uppercase tracking-[0.15em] mt-1">
                            {session.duration_minutes} min • {new Date(session.session_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    {session.notes && (
                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-dark-900">
                        <p className="text-sm font-medium text-slate-600 dark:text-cream-200/60 leading-relaxed italic">
                          "{session.notes}"
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
