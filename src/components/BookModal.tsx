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
    isbn: '',
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
        isbn: book.isbn || '',
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
      isbn: formData.isbn || null,
      description: formData.description || null,
      status: formData.status,
      current_page: formData.current_page ? parseInt(formData.current_page) : 0,
      updated_at: new Date().toISOString(),
    };

    if (book) {
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
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">
            {book ? 'Editar Livro' : 'Adicionar Livro'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Autor *
              </label>
              <input
                type="text"
                name="author"
                value={formData.author}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ano de Publicação
              </label>
              <input
                type="number"
                name="publication_year"
                value={formData.publication_year}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Gênero
              </label>
              <select
                name="genre_id"
                value={formData.genre_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
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
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Total de Páginas
              </label>
              <input
                type="number"
                name="total_pages"
                value={formData.total_pages}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="not_started">Não Iniciado</option>
                <option value="in_progress">Em Andamento</option>
                <option value="completed">Concluído</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Página Atual
              </label>
              <input
                type="number"
                name="current_page"
                value={formData.current_page}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                ISBN
              </label>
              <input
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                URL da Capa
              </label>
              <input
                type="url"
                name="cover_url"
                value={formData.cover_url}
                onChange={handleChange}
                placeholder="https://exemplo.com/capa.jpg"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descrição
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition font-medium disabled:opacity-50"
            >
              {loading ? 'Salvando...' : book ? 'Salvar Alterações' : 'Adicionar Livro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
