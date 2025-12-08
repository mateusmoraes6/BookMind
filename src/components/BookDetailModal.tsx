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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Detalhes do Livro</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
              title="Editar"
            >
              <Edit2 className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-6 h-6 text-slate-600" />
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
                <h1 className="text-3xl font-bold text-slate-900">{book.title}</h1>
                <p className="text-lg text-slate-600 mt-2">{book.author}</p>
              </div>

              {book.description && (
                <p className="text-slate-700">{book.description}</p>
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
                <div>
                  <div className="flex justify-between text-sm text-slate-600 mb-2">
                    <span>Progresso: {book.current_page} de {book.total_pages}</span>
                    <span>{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 transition-all"
                      style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">Páginas Lidas</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalPagesRead}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Sessões</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{sessions.length}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-600 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm">Tempo Total</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{Math.round(totalTimeRead / 60)}h</p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Sessões de Leitura</h3>
              <button
                onClick={() => setShowAddSession(!showAddSession)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition text-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Sessão
              </button>
            </div>

            {showAddSession && (
              <form onSubmit={handleAddSession} className="bg-slate-50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Páginas Lidas *
                    </label>
                    <input
                      type="number"
                      value={sessionData.pages_read}
                      onChange={(e) => setSessionData({ ...sessionData, pages_read: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Duração (minutos) *
                    </label>
                    <input
                      type="number"
                      value={sessionData.duration_minutes}
                      onChange={(e) => setSessionData({ ...sessionData, duration_minutes: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                      required
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={sessionData.notes}
                    onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSession(false)}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                  >
                    Salvar Sessão
                  </button>
                </div>
              </form>
            )}

            {sessions.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
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
