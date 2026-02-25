import { useEffect, useState } from 'react';
import { X, Edit2, BookOpen, Star, Calendar, FileText, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BookDetailModalProps {
  book: any;
  onClose: () => void;
  onEdit: () => void;
}

export default function BookDetailModal({ book, onClose, onEdit }: BookDetailModalProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [sessionData, setSessionData] = useState({
    pages_read: '',
    duration_minutes: '',
    notes: '',
  });

  useEffect(() => {
    loadBookData();
  }, [book.id]);

  const loadBookData = async () => {
    // Only load sessions since notes are unused
    const { data } = await (supabase
      .from('reading_sessions') as any)
      .select('*')
      .eq('book_id', book.id)
      .order('session_date', { ascending: false });

    if (data) setSessions(data);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newPage = book.current_page + parseInt(sessionData.pages_read);

    await Promise.all([
      (supabase.from('reading_sessions') as any).insert({
        user_id: user.id,
        book_id: book.id,
        pages_read: parseInt(sessionData.pages_read),
        start_page: book.current_page,
        end_page: newPage,
        duration_minutes: parseInt(sessionData.duration_minutes),
        notes: sessionData.notes || null,
        session_date: new Date().toISOString().split('T')[0],
      }),
      (supabase
        .from('books') as any)
        .update({
          current_page: newPage,
          status: newPage >= book.total_pages ? 'completed' : 'in_progress',
          completed_at: newPage >= book.total_pages ? new Date().toISOString() : null,
        })
        .eq('id', book.id),
    ]);

    setShowAddSession(false);
    setSessionData({ pages_read: '', duration_minutes: '', notes: '' });
    loadBookData();
    window.location.reload();
  };

  const totalPagesRead = sessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
  const totalTimeRead = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-dark-800 relative">
        <div className="sticky top-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-800 p-8 flex items-center justify-between z-20">
          <h2 className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">Detalhes do Livro</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-all"
              title="Editar"
            >
              <Edit2 className="w-5 h-5 text-slate-600 dark:text-cream-200/20" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-all"
            >
              <X className="w-6 h-6 text-slate-600 dark:text-cream-200/20" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-48 h-72 object-cover rounded-lg shadow-md mx-auto md:mx-0"
              />
            ) : (
              <div className="w-48 h-72 bg-slate-200 rounded-lg flex items-center justify-center mx-auto md:mx-0">
                <BookOpen className="w-16 h-16 text-slate-400" />
              </div>
            )}

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-cream-50 tracking-tight">{book.title}</h1>
                <p className="text-lg font-bold text-slate-600 dark:text-cream-200/40 mt-1 uppercase tracking-wider">{book.author}</p>
              </div>

              {book.description && (
                <p className="text-slate-700 dark:text-cream-200/60 leading-relaxed font-medium">{book.description}</p>
              )}

              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                {book.publication_year && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{book.publication_year}</span>
                  </div>
                )}
                {book.total_pages > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-600">{book.total_pages} páginas</span>
                  </div>
                )}
                {book.personal_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-sm text-slate-600">{book.personal_rating}/5</span>
                  </div>
                )}
              </div>

              {book.status === 'in_progress' && book.total_pages > 0 && (
                <div className="mt-8">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-cream-200/20 mb-3">
                    <span>Progresso: {book.current_page} de {book.total_pages}</span>
                    <span className="text-slate-900 dark:text-cream-100">{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cream-100 transition-all shadow-[0_0_10px_rgba(245,245,244,0.3)]"
                      style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-50 dark:bg-dark-800 rounded-3xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-cream-200/20 mb-3 relative z-10">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Páginas Lidas</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10">{totalPagesRead}</p>
            </div>
            <div className="bg-slate-50 dark:bg-dark-800 rounded-3xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-cream-200/20 mb-3 relative z-10">
                <Calendar className="w-3.5 h-3.5" />
                <span>Sessões</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10">{sessions.length}</p>
            </div>
            <div className="bg-slate-50 dark:bg-dark-800 rounded-3xl p-6 border border-slate-100 dark:border-dark-700 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cream-100/5 rounded-full -mr-12 -mt-12 blur-2xl" />
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-cream-200/20 mb-3 relative z-10">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Tempo Total</span>
              </div>
              <p className="text-3xl font-black text-slate-900 dark:text-cream-50 relative z-10">{Math.round(totalTimeRead / 60)}h</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black text-slate-900 dark:text-cream-50">Sessões de Leitura</h3>
              <button
                onClick={() => setShowAddSession(!showAddSession)}
                className="flex items-center gap-2 px-4 py-2 bg-cream-100 text-dark-950 rounded-lg hover:bg-cream-50 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Sessão
              </button>
            </div>

            {showAddSession && (
              <form onSubmit={handleAddSession} className="bg-slate-50 dark:bg-dark-800 rounded-[2rem] p-8 mb-8 space-y-6 border border-slate-100 dark:border-dark-700 animate-in slide-in-from-top-4 duration-300">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                      Páginas Lidas *
                    </label>
                    <input
                      type="number"
                      value={sessionData.pages_read}
                      onChange={(e) => setSessionData({ ...sessionData, pages_read: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black text-lg transition-all"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                      Duração (minutos) *
                    </label>
                    <input
                      type="number"
                      value={sessionData.duration_minutes}
                      onChange={(e) => setSessionData({ ...sessionData, duration_minutes: e.target.value })}
                      className="w-full px-5 py-4 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black text-lg transition-all"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={sessionData.notes}
                    onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                    className="w-full px-5 py-4 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-700 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowAddSession(false)}
                    className="flex-1 px-6 py-4 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-cream-200/40 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-700 transition-all font-black text-xs uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-4 bg-cream-100 text-dark-950 rounded-2xl hover:bg-cream-50 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transform active:scale-[0.98]"
                  >
                    Salvar Sessão
                  </button>
                </div>
              </form>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-cream-200/40">
                Nenhuma sessão de leitura registrada
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div key={session.id} className="bg-slate-50 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">
                          {session.pages_read} páginas lidas
                        </p>
                        <p className="text-sm text-slate-600 mt-1">
                          {session.duration_minutes} minutos • {new Date(session.session_date).toLocaleDateString('pt-BR')}
                        </p>
                        {session.notes && (
                          <p className="text-sm text-slate-700 mt-2">{session.notes}</p>
                        )}
                      </div>
                    </div>
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
