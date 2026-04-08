import { useState, useEffect } from 'react';
import { X, Save, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Book, BOOK_STATUS_LIST, BookStatus } from '../types/book';

interface Genre {
  id: string;
  name: string;
  color: string;
}

interface BookModalProps {
  book?: Book | null;
  onClose: () => void;
}

export default function BookModal({ book, onClose }: BookModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    genre_id: book?.genre_id || '',
    status: (book?.status as BookStatus) || 'want_to_read',
    total_pages: book?.total_pages?.toString() || '',
    current_page: book?.current_page?.toString() || '0',
    cover_url: book?.cover_url || '',
    description: book?.description || '',
    publication_year: book?.publication_year?.toString() || '',
    personal_rating: book?.personal_rating?.toString() || '',
  });

  useEffect(() => {
    loadGenres();
    
    // Accessibility: ESC to close
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const loadGenres = async () => {
    const { data } = await (supabase.from('genres') as any).select('*').order('name');
    if (data) setGenres(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const data = {
      title: formData.title,
      author: formData.author,
      genre_id: formData.genre_id || null,
      status: formData.status,
      total_pages: parseInt(formData.total_pages) || 0,
      current_page: parseInt(formData.current_page) || 0,
      cover_url: formData.cover_url || null,
      description: formData.description || null,
      publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
      personal_rating: formData.personal_rating ? parseInt(formData.personal_rating) : null,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = book
      ? await (supabase.from('books') as any).update(data).eq('id', book.id)
      : await (supabase.from('books') as any).insert([data]);

    if (!error) onClose();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div 
        className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-dark-800 animate-in zoom-in slide-in-from-bottom-4 duration-500"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sticky top-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-800 p-8 flex items-center justify-between z-10">
          <h2 id="modal-title" className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">
            {book ? 'Editar Livro' : 'Novo Livro'}
          </h2>
          <button
            onClick={onClose}
            className="p-3 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl text-slate-600 dark:text-cream-200/60 hover:bg-slate-50 dark:hover:bg-dark-800 transition-all shadow-sm transform active:scale-95"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Título *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="author" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Autor *
              </label>
              <input
                id="author"
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="genre" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Gênero
              </label>
              <select
                id="genre"
                value={formData.genre_id}
                onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all appearance-none cursor-pointer"
              >
                <option value="">Sem categoria</option>
                {genres.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all appearance-none cursor-pointer"
              >
                {BOOK_STATUS_LIST.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="total_pages" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Total de Páginas
              </label>
              <input
                id="total_pages"
                type="number"
                value={formData.total_pages}
                onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="current_page" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Página Atual
              </label>
              <input
                id="current_page"
                type="number"
                value={formData.current_page}
                onChange={(e) => setFormData({ ...formData, current_page: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="publication_year" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Ano de Publicação
              </label>
              <input
                id="publication_year"
                type="number"
                value={formData.publication_year}
                onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="rating" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
                Avaliação (0-5)
              </label>
              <input
                id="rating"
                type="number"
                min="0"
                max="5"
                step="1"
                value={formData.personal_rating}
                onChange={(e) => setFormData({ ...formData, personal_rating: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="cover_url" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
              URL da Capa
            </label>
            <div className="relative">
              <input
                id="cover_url"
                type="url"
                value={formData.cover_url}
                onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
                className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
                placeholder="https://exemplo.com/capa.jpg"
              />
              <Upload className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] ml-1">
              Descrição
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-[2rem] focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-bold transition-all resize-none min-h-[120px]"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-8 py-5 bg-white dark:bg-dark-950 border border-slate-200 dark:border-dark-800 text-slate-600 dark:text-cream-200/40 rounded-2xl hover:bg-slate-50 dark:hover:bg-dark-800 transition-all font-black text-xs uppercase tracking-widest transform active:scale-95 shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-8 py-5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/40 disabled:opacity-50 transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 mb-0.5" />
              {loading ? 'Salvando...' : 'Salvar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
