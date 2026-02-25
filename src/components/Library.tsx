import { useEffect, useState } from 'react';
import { Plus, Search, Filter, BookOpen, Star, Edit2, Trash2, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import BookModal from './BookModal';
import BookDetailModal from './BookDetailModal';

interface Book {
  id: string;
  title: string;
  author: string;
  publication_year: number | null;
  total_pages: number;
  cover_url: string | null;
  status: 'not_started' | 'in_progress' | 'completed';
  personal_rating: number | null;
  current_page: number;
  genres?: { id: string; name: string; color: string };
}

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    if (user) {
      loadBooks();
    }
  }, [user]);

  useEffect(() => {
    filterBooks();
  }, [books, searchTerm, filterStatus]);

  const loadBooks = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('books')
      .select('*, genres(id, name, color)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setBooks(data);
    }

    setLoading(false);
  };

  const filterBooks = () => {
    let filtered = [...books];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        book =>
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(book => book.status === filterStatus);
    }

    setFilteredBooks(filtered);
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;

    const { error } = await supabase.from('books').delete().eq('id', bookId);

    if (!error) {
      setBooks(books.filter(b => b.id !== bookId));
    }
  };

  const handleEdit = (book: Book) => {
    setSelectedBook(book);
    setShowModal(true);
  };

  const handleView = (book: Book) => {
    setSelectedBook(book);
    setShowDetailModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedBook(null);
    loadBooks();
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedBook(null);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      not_started: { label: 'Não Iniciado', color: 'bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-cream-200/40' },
      in_progress: { label: 'Lendo', color: 'bg-cream-100 text-dark-950' },
      completed: { label: 'Concluído', color: 'bg-slate-900 dark:bg-white text-white dark:text-dark-950' },
    };
    return badges[status as keyof typeof badges] || badges.not_started;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-cream-100"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50 leading-tight">Biblioteca</h1>
          <p className="text-slate-500 dark:text-cream-200/40 mt-1 text-sm font-medium tracking-wide">
            {filteredBooks.length} livros encontrados
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest w-full sm:w-auto transform active:scale-95"
        >
          <Plus className="w-5 h-5 mb-0.5" />
          Adicionar Livro
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título ou autor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-medium transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-medium transition-all"
            >
              <option value="all">Todos os Status</option>
              <option value="not_started">Não Iniciado</option>
              <option value="in_progress">Lendo Agora</option>
              <option value="completed">Concluídos</option>
            </select>
          </div>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Nenhum livro encontrado</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            {searchTerm || filterStatus !== 'all'
              ? 'Tente ajustar seus filtros de busca'
              : 'Comece adicionando seu primeiro livro à biblioteca'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-3 px-8 py-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest"
            >
              <Plus className="w-5 h-5 mb-0.5" />
              Adicionar Primeiro Livro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const statusBadge = getStatusBadge(book.status);
            return (
              <div
                key={book.id}
                className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 overflow-hidden hover:shadow-2xl hover:border-dark-700 transition-all duration-300 group"
              >
                <div className="relative">
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-64 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 bg-slate-50 dark:bg-dark-800 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-slate-300 dark:text-dark-700" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => handleView(book)}
                      className="p-2.5 bg-white dark:bg-dark-950 rounded-xl shadow-xl hover:bg-cream-100 dark:hover:bg-cream-100 hover:text-dark-950 dark:hover:text-dark-950 transition-all border border-transparent dark:border-dark-800"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(book)}
                      className="p-2.5 bg-white dark:bg-dark-950 rounded-xl shadow-xl hover:bg-cream-100 dark:hover:bg-cream-100 hover:text-dark-950 dark:hover:text-dark-950 transition-all border border-transparent dark:border-dark-800"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-2.5 bg-white dark:bg-dark-950 rounded-xl shadow-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all border border-transparent dark:border-dark-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-black text-slate-900 dark:text-cream-50 truncate text-sm" title={book.title}>
                    {book.title}
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/20 truncate mt-1.5 tracking-wider">{book.author}</p>

                  <div className="flex items-center justify-between mt-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                    {book.personal_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-cream-100">{book.personal_rating}</span>
                      </div>
                    )}
                  </div>

                  {book.genres && (
                    <div className="mt-4">
                      <span
                        className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border border-current"
                        style={{ backgroundColor: `${book.genres.color}10`, color: book.genres.color }}
                      >
                        {book.genres.name}
                      </span>
                    </div>
                  )}

                  {book.status === 'in_progress' && book.total_pages > 0 && (
                    <div className="mt-6">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cream-200/20 mb-2">
                        <span>Pág. {book.current_page} / {book.total_pages}</span>
                        <span className="text-slate-900 dark:text-cream-100">{Math.round((book.current_page / book.total_pages) * 100)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cream-100 transition-all shadow-[0_0_8px_rgba(245,245,244,0.3)]"
                          style={{ width: `${(book.current_page / book.total_pages) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <BookModal
          book={selectedBook}
          onClose={handleModalClose}
        />
      )}

      {showDetailModal && selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={handleDetailModalClose}
          onEdit={() => {
            setShowDetailModal(false);
            setShowModal(true);
          }}
        />
      )}
    </div>
  );
}
