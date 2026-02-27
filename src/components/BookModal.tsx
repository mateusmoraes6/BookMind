import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface BookModalProps {
  book: any | null;
  onClose: () => void;
}

export default function BookModal({ book, onClose }: BookModalProps) {
  const { user } = useAuth();
  const [genres, setGenres] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    publication_year: '',
    genre_id: '',
    total_pages: '',
    cover_url: '',
    description: '',
    status: 'not_started',
    current_page: '0',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGenres();
    if (book) {
      setFormData({
        title: book.title || '',
        author: book.author || '',
        publication_year: book.publication_year?.toString() || '',
        genre_id: book.genre_id || '',
        total_pages: book.total_pages?.toString() || '',
        cover_url: book.cover_url || '',
        description: book.description || '',
        status: book.status || 'not_started',
        current_page: book.current_page?.toString() || '0',
      });
    }
  }, [book]);

  const loadGenres = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('genres')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (data) {
      setGenres(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    const bookData = {
      user_id: user.id,
      title: formData.title,
      author: formData.author,
      publication_year: formData.publication_year ? parseInt(formData.publication_year) : null,
      genre_id: formData.genre_id || null,
      total_pages: formData.total_pages ? parseInt(formData.total_pages) : 0,
      cover_url: formData.cover_url || null,
      isbn: null,
      description: formData.description || null,
      status: formData.status,
      current_page: formData.current_page ? parseInt(formData.current_page) : 0,
      updated_at: new Date().toISOString(),
    };

    if (book && book.id) {
      await (supabase.from('books') as any).update(bookData).eq('id', book.id);
    } else {
      await (supabase.from('books') as any).insert(bookData);
    }

    setLoading(false);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-dark-800 shadow-2xl relative">
        <div className="sticky top-0 bg-white/80 dark:bg-dark-900/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-800 p-8 flex items-center justify-between z-20">
          <h2 className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">
            {book && book.id ? 'Editar Livro' : 'Adicionar Livro'}
          </h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-all"
          >
            <X className="w-6 h-6 text-slate-400 dark:text-cream-200/20" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all placeholder-slate-300 dark:placeholder-dark-800"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Autor *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Ano de Publicação
              </label>
              <input
                type="number"
                name="publication_year"
                value={formData.publication_year}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Gênero
              </label>
              <select
                name="genre_id"
                value={formData.genre_id}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              >
                <option value="">Selecione um gênero</option>
                {genres.map((genre) => (
                  <option key={genre.id} value={genre.id}>
                    {genre.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Total de Páginas
              </label>
              <input
                type="number"
                name="total_pages"
                value={formData.total_pages}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              >
                <option value="not_started">Não Iniciado</option>
                <option value="want_to_read">Quero Ler</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Página Atual
              </label>
              <input
                type="number"
                name="current_page"
                value={formData.current_page}
                onChange={handleChange}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                URL da Capa
              </label>
              <input
                type="url"
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/capa.jpg"
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all placeholder-slate-300 dark:placeholder-dark-800"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-[2rem] focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-cream-100 dark:text-cream-50 font-bold transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-4 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-cream-200/50 rounded-2xl hover:bg-slate-200 dark:hover:bg-dark-700 transition-all font-black text-xs uppercase tracking-widest border border-transparent dark:border-dark-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/40 disabled:opacity-50 transform active:scale-[0.98]"
            >
              {loading ? 'Salvando...' : (book && book.id) ? 'Salvar Alterações' : 'Adicionar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
