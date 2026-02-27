import { useEffect, useState } from 'react';
import { Plus, Search, BookOpen, Edit2, Trash2, Eye, Heart } from 'lucide-react';
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
    status: string;
    personal_rating: number | null;
    current_page: number;
    genres?: { id: string; name: string; color: string };
}

export default function Wishlist() {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isInitialNewBook, setIsInitialNewBook] = useState(false);

    useEffect(() => {
        if (user) {
            loadBooks();
        }
    }, [user]);

    useEffect(() => {
        filterBooks();
    }, [books, searchTerm]);

    const loadBooks = async () => {
        if (!user) return;

        const { data } = await supabase
            .from('books')
            .select('*, genres(id, name, color)')
            .eq('user_id', user.id)
            .eq('status', 'want_to_read')
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

        setFilteredBooks(filtered);
    };

    const handleDelete = async (bookId: string) => {
        if (!confirm('Tem certeza que deseja excluir este livro da lista de desejos?')) return;

        const { error } = await supabase.from('books').delete().eq('id', bookId);

        if (!error) {
            setBooks(books.filter(b => b.id !== bookId));
        }
    };

    const handleEdit = (book: Book) => {
        setSelectedBook(book);
        setIsInitialNewBook(false);
        setShowModal(true);
    };

    const handleView = (book: Book) => {
        setSelectedBook(book);
        setShowDetailModal(true);
    };

    const handleAddWishlistBook = () => {
        setSelectedBook(null);
        setIsInitialNewBook(true); // pass flag that we want to default to 'want_to_read' if we change BookModal
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedBook(null);
        setIsInitialNewBook(false);
        loadBooks();
    };

    const handleDetailModalClose = () => {
        setShowDetailModal(false);
        setSelectedBook(null);
        loadBooks(); // refresh just in case status changed
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
                    <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50 leading-tight">Lista de Desejos</h1>
                    <p className="text-slate-500 dark:text-cream-200/40 mt-1 text-sm font-medium tracking-wide">
                        {filteredBooks.length} livros na lista
                    </p>
                </div>
                <button
                    onClick={handleAddWishlistBook}
                    className="flex items-center justify-center gap-3 px-6 py-3.5 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl transition-all shadow-xl shadow-rose-500/20 font-black text-xs uppercase tracking-widest w-full sm:w-auto transform active:scale-95"
                >
                    <Heart className="w-5 h-5 mb-0.5 fill-current" />
                    Adicionar à Lista
                </button>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 p-6">
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-rose-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar títulos ou autores que quero ler..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-400 dark:text-cream-50 font-medium transition-all"
                    />
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 p-16 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                    <Heart className="w-20 h-20 text-rose-200 dark:text-rose-900 mx-auto mb-6 relative z-10" />
                    <h3 className="text-2xl font-black text-slate-900 dark:text-cream-100 mb-2 relative z-10">Sua lista está vazia</h3>
                    <p className="text-slate-500 dark:text-cream-200/40 mb-10 max-w-sm mx-auto text-sm font-medium relative z-10">
                        {searchTerm
                            ? 'Nenhum livro corresponde à sua busca'
                            : 'Adicione os livros que você sonha em ler algum dia'}
                    </p>
                    {!searchTerm && (
                        <button
                            onClick={handleAddWishlistBook}
                            className="inline-flex items-center gap-3 px-10 py-5 bg-rose-500 hover:bg-rose-400 text-white rounded-2xl transition shadow-2xl shadow-rose-500/30 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 relative z-10"
                        >
                            <Plus className="w-5 h-5" />
                            Adicionar Livro
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                        <div
                            key={book.id}
                            className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-dark-800 overflow-hidden hover:shadow-2xl hover:border-rose-400/50 dark:hover:border-rose-500/50 transition-all duration-300 group"
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
                                <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                                    <button
                                        onClick={() => handleView(book)}
                                        className="p-3 bg-dark-950/90 backdrop-blur-md text-cream-100 rounded-xl shadow-2xl hover:bg-cream-100 hover:text-dark-950 transition-all border border-dark-800"
                                        title="Visualizar"
                                    >
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleEdit(book)}
                                        className="p-3 bg-dark-950/90 backdrop-blur-md text-cream-100 rounded-xl shadow-2xl hover:bg-cream-100 hover:text-dark-950 transition-all border border-dark-800"
                                        title="Editar"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(book.id)}
                                        className="p-3 bg-dark-950/90 backdrop-blur-md text-red-400 rounded-xl shadow-2xl hover:bg-red-500 hover:text-white transition-all border border-dark-800"
                                        title="Excluir"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="font-black text-slate-900 dark:text-cream-50 truncate text-sm" title={book.title}>
                                    {book.title}
                                </h3>
                                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/20 truncate mt-1.5 tracking-wider">{book.author}</p>

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
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <BookModal
                    book={selectedBook || (isInitialNewBook ? { status: 'want_to_read' } : null)}
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
