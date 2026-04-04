import { useEffect, useState } from 'react';
import { Plus, Search, BookOpen, Star, Edit2, Trash2, Eye, ArrowLeft, BookMarked, CheckCircle2, Clock, Layers } from 'lucide-react';
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
  genre_id: string | null;
  genres?: { id: string; name: string; color: string } | null;
}

interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface CategoryShelf {
  genre: Genre | null; // null = "Sem categoria"
  books: Book[];
}

type ViewMode = 'shelves' | 'category-books';

export default function Library() {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('shelves');
  const [selectedShelf, setSelectedShelf] = useState<CategoryShelf | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const [booksRes, genresRes] = await Promise.all([
      supabase
        .from('books')
        .select('*, genres(id, name, color)')
        .eq('user_id', user.id)
        .order('title', { ascending: true }),
      (supabase.from('genres') as any).select('*').eq('user_id', user.id).order('name'),
    ]);

    if (booksRes.data) setBooks(booksRes.data);
    if (genresRes.data) setGenres(genresRes.data);

    setLoading(false);
  };

  // Build shelves: one per genre that has books + "uncategorized" shelf
  const buildShelves = (): CategoryShelf[] => {
    const shelves: CategoryShelf[] = [];

    genres.forEach((genre) => {
      const genreBooks = books.filter((b) => b.genre_id === genre.id);
      if (genreBooks.length > 0) {
        shelves.push({ genre, books: genreBooks });
      }
    });

    const uncategorized = books.filter((b) => !b.genre_id);
    if (uncategorized.length > 0) {
      shelves.push({ genre: null, books: uncategorized });
    }

    return shelves;
  };

  const shelves = buildShelves();

  const handleShelfClick = (shelf: CategoryShelf) => {
    setSelectedShelf(shelf);
    setViewMode('category-books');
    setSearchTerm('');
    setFilterStatus('all');
  };

  const handleBack = () => {
    setViewMode('shelves');
    setSelectedShelf(null);
  };

  const filteredBooksInShelf = (): Book[] => {
    if (!selectedShelf) return [];
    let filtered = [...selectedShelf.books];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (b) =>
          b.title.toLowerCase().includes(term) ||
          b.author.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter((b) => b.status === filterStatus);
    }

    return filtered;
  };

  const handleDelete = async (bookId: string) => {
    if (!confirm('Tem certeza que deseja excluir este livro?')) return;
    const { error } = await supabase.from('books').delete().eq('id', bookId);
    if (!error) {
      setBooks(books.filter((b) => b.id !== bookId));
      if (selectedShelf) {
        setSelectedShelf({
          ...selectedShelf,
          books: selectedShelf.books.filter((b) => b.id !== bookId),
        });
      }
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
    loadData();
  };

  const handleDetailModalClose = () => {
    setShowDetailModal(false);
    setSelectedBook(null);
  };

  const getStatusMeta = (status: string) => {
    const map = {
      not_started: {
        label: 'Não Iniciado',
        color: 'bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-cream-200/40',
        icon: Clock,
      },
      in_progress: {
        label: 'Lendo',
        color: 'bg-amber-100/80 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400',
        icon: BookMarked,
      },
      completed: {
        label: 'Concluído',
        color: 'bg-emerald-100/80 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
        icon: CheckCircle2,
      },
    };
    return map[status as keyof typeof map] || map.not_started;
  };

  const getStatusCounts = (shelfBooks: Book[]) => ({
    total: shelfBooks.length,
    reading: shelfBooks.filter((b) => b.status === 'in_progress').length,
    done: shelfBooks.filter((b) => b.status === 'completed').length,
    pending: shelfBooks.filter((b) => b.status === 'not_started').length,
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-cream-100"></div>
      </div>
    );
  }

  // ── SHELVES VIEW ──────────────────────────────────────────────────────────
  if (viewMode === 'shelves') {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50 leading-tight">
              Biblioteca
            </h1>
            <p className="text-slate-500 dark:text-cream-200/40 mt-1 text-sm font-medium tracking-wide">
              {books.length} {books.length === 1 ? 'livro' : 'livros'} em {shelves.length} {shelves.length === 1 ? 'categoria' : 'categorias'}
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

        {/* Empty state */}
        {shelves.length === 0 && (
          <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cream-100/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <BookOpen className="w-20 h-20 text-slate-200 dark:text-dark-800 mx-auto mb-6 relative z-10" />
            <h3 className="text-2xl font-black text-slate-900 dark:text-cream-100 mb-2 relative z-10">
              Sua biblioteca está vazia
            </h3>
            <p className="text-slate-500 dark:text-cream-200/40 mb-10 max-w-sm mx-auto text-sm font-medium relative z-10">
              Adicione seu primeiro livro para começar a organizar sua coleção por categorias
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-3 px-10 py-5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition shadow-2xl shadow-black/40 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Adicionar Livro
            </button>
          </div>
        )}

        {/* Shelves grid */}
        {shelves.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {shelves.map((shelf) => {
              const counts = getStatusCounts(shelf.books);
              const color = shelf.genre?.color || '#94a3b8';
              const name = shelf.genre?.name || 'Sem Categoria';
              // Show up to 5 "spines" as visual preview
              const preview = shelf.books.slice(0, 5);

              return (
                <button
                  key={shelf.genre?.id || 'uncategorized'}
                  onClick={() => handleShelfClick(shelf)}
                  className="group bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 overflow-hidden hover:shadow-2xl hover:border-dark-700 transition-all duration-300 text-left transform hover:-translate-y-1"
                >
                  {/* Top accent bar */}
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: color }}
                  />

                  <div className="p-6 pb-4">
                    {/* Category label */}
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border mb-3"
                          style={{
                            backgroundColor: `${color}15`,
                            color,
                            borderColor: `${color}30`,
                          }}
                        >
                          <Layers className="w-3 h-3" />
                          {name}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-cream-50 leading-tight group-hover:text-slate-700 dark:group-hover:text-cream-100 transition-colors">
                          {counts.total} {counts.total === 1 ? 'livro' : 'livros'}
                        </h2>
                      </div>
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 transition-transform group-hover:scale-110 duration-300"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>

                    {/* Book spine thumbnails — uniform height, cover image cropped */}
                    <div className="flex items-stretch gap-[4px] h-24 mb-5 px-1">
                      {preview.map((book) => (
                        <div
                          key={book.id}
                          className="relative flex-1 overflow-hidden rounded-t-md shadow-md transition-all duration-300 group-hover:shadow-lg"
                          title={book.title}
                          style={{ minWidth: 0 }}
                        >
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            />
                          ) : (
                            // Fallback: genre color with first letter of title
                            <div
                              className="w-full h-full flex items-end justify-center pb-1"
                              style={{ backgroundColor: `${color}CC` }}
                            >
                              <span
                                className="text-white font-black text-[10px] leading-none opacity-60"
                                style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                              >
                                {book.title.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          {/* Subtle inner shadow overlay for depth */}
                          <div className="absolute inset-0 shadow-[inset_-2px_0_6px_rgba(0,0,0,0.25)]" />
                        </div>
                      ))}
                      {/* Filler spines if few books */}
                      {Array.from({ length: Math.max(0, 5 - preview.length) }).map((_, i) => (
                        <div
                          key={`filler-${i}`}
                          className="flex-1 rounded-t-md border border-dashed border-slate-200 dark:border-dark-700"
                          style={{ minWidth: 0 }}
                        />
                      ))}
                    </div>

                    {/* Shelf plank */}
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-dark-800 mb-4" />

                    {/* Status mini stats */}
                    <div className="flex items-center gap-3">
                      {counts.reading > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-cream-200/40 uppercase tracking-wider">
                            {counts.reading} lendo
                          </span>
                        </div>
                      )}
                      {counts.done > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-cream-200/40 uppercase tracking-wider">
                            {counts.done} concluído{counts.done > 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {counts.pending > 0 && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-dark-600" />
                          <span className="text-[10px] font-bold text-slate-500 dark:text-cream-200/40 uppercase tracking-wider">
                            {counts.pending} na fila
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {showModal && (
          <BookModal book={selectedBook} onClose={handleModalClose} />
        )}
      </div>
    );
  }

  // ── CATEGORY BOOKS VIEW ───────────────────────────────────────────────────
  const visibleBooks = filteredBooksInShelf();
  const shelfColor = selectedShelf?.genre?.color || '#94a3b8';
  const shelfName = selectedShelf?.genre?.name || 'Sem Categoria';
  const shelfCounts = selectedShelf ? getStatusCounts(selectedShelf.books) : null;

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-3 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-600 dark:text-cream-200/60 hover:bg-slate-50 dark:hover:bg-dark-800 transition-all shadow-sm hover:shadow-md transform active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest"
                style={{
                  backgroundColor: `${shelfColor}15`,
                  color: shelfColor,
                }}
              >
                <Layers className="w-2.5 h-2.5" />
                {shelfName}
              </div>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50 leading-tight">
              {shelfName}
            </h1>
            <p className="text-slate-500 dark:text-cream-200/40 mt-0.5 text-sm font-medium">
              {visibleBooks.length} de {selectedShelf?.books.length} livros
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 px-6 py-3.5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest w-full sm:w-auto transform active:scale-95"
        >
          <Plus className="w-5 h-5 mb-0.5" />
          Adicionar Livro
        </button>
      </div>

      {/* Status summary pills */}
      {shelfCounts && (
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-900 dark:bg-cream-100 text-white dark:text-dark-950 shadow-lg'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-500 dark:text-cream-200/50 hover:border-dark-600'
            }`}
          >
            Todos · {shelfCounts.total}
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filterStatus === 'in_progress'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-500 dark:text-cream-200/50 hover:border-amber-400/50'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Lendo · {shelfCounts.reading}
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filterStatus === 'completed'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-500 dark:text-cream-200/50 hover:border-emerald-400/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluídos · {shelfCounts.done}
          </button>
          <button
            onClick={() => setFilterStatus('not_started')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              filterStatus === 'not_started'
                ? 'bg-slate-500 text-white shadow-lg'
                : 'bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-500 dark:text-cream-200/50 hover:border-slate-400/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Na Fila · {shelfCounts.pending}
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 p-5">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cream-100 transition-colors" />
          <input
            type="text"
            placeholder="Buscar por título ou autor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-medium transition-all"
          />
        </div>
      </div>

      {/* Empty filtered state */}
      {visibleBooks.length === 0 && (
        <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] border border-slate-200 dark:border-dark-800 p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-200 dark:text-dark-800 mx-auto mb-4" />
          <h3 className="text-lg font-black text-slate-900 dark:text-cream-100 mb-1">
            Nenhum livro encontrado
          </h3>
          <p className="text-slate-500 dark:text-cream-200/40 text-sm font-medium">
            Tente ajustar os filtros ou a busca
          </p>
        </div>
      )}

      {/* Books grid */}
      {visibleBooks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleBooks.map((book) => {
            const statusMeta = getStatusMeta(book.status);
            const StatusIcon = statusMeta.icon;
            const progress =
              book.status === 'in_progress' && book.total_pages > 0
                ? Math.round((book.current_page / book.total_pages) * 100)
                : null;

            return (
              <div
                key={book.id}
                className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 overflow-hidden hover:shadow-2xl hover:border-dark-700 transition-all duration-300 group"
              >
                {/* Cover */}
                <div className="relative">
                  {/* Category color top stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1 z-10"
                    style={{ backgroundColor: shelfColor }}
                  />
                  {book.cover_url ? (
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-56 flex items-center justify-center"
                      style={{ backgroundColor: `${shelfColor}10` }}
                    >
                      <BookOpen
                        className="w-14 h-14 opacity-20"
                        style={{ color: shelfColor }}
                      />
                    </div>
                  )}

                  {/* Progress ring (in_progress only) */}
                  {progress !== null && (
                    <div className="absolute top-4 left-4 w-11 h-11 z-10">
                      <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                        <circle
                          cx="22" cy="22" r="18"
                          fill="rgba(0,0,0,0.5)"
                          stroke="rgba(255,255,255,0.15)"
                          strokeWidth="2"
                        />
                        <circle
                          cx="22" cy="22" r="18"
                          fill="transparent"
                          stroke={shelfColor}
                          strokeWidth="3"
                          strokeDasharray={`${(progress / 100) * 113} 113`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-white">
                        {progress}%
                      </span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 z-10">
                    <button
                      onClick={() => handleView(book)}
                      className="p-2.5 bg-dark-950/90 backdrop-blur-md text-cream-100 rounded-xl shadow-2xl hover:bg-cream-100 hover:text-dark-950 transition-all border border-dark-800"
                      title="Visualizar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleEdit(book)}
                      className="p-2.5 bg-dark-950/90 backdrop-blur-md text-cream-100 rounded-xl shadow-2xl hover:bg-cream-100 hover:text-dark-950 transition-all border border-dark-800"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="p-2.5 bg-dark-950/90 backdrop-blur-md text-red-400 rounded-xl shadow-2xl hover:bg-red-500 hover:text-white transition-all border border-dark-800"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3
                    className="font-black text-slate-900 dark:text-cream-50 truncate text-sm"
                    title={book.title}
                  >
                    {book.title}
                  </h3>
                  <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/20 truncate mt-1 tracking-wider">
                    {book.author}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-xl ${statusMeta.color}`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusMeta.label}
                    </span>
                    {book.personal_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-slate-900 dark:text-cream-100">
                          {book.personal_rating}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {book.status === 'in_progress' && book.total_pages > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cream-200/20 mb-2">
                        <span>Pág. {book.current_page} / {book.total_pages}</span>
                        <span className="text-slate-900 dark:text-cream-100">
                          {Math.round((book.current_page / book.total_pages) * 100)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(book.current_page / book.total_pages) * 100}%`,
                            backgroundColor: shelfColor,
                          }}
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
        <BookModal book={selectedBook} onClose={handleModalClose} />
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
