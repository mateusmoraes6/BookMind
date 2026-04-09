import { useState, useEffect } from 'react';
import { Save, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Book, BOOK_STATUS_LIST, BookStatus } from '../types/book';
import { Modal } from './ui/Modal';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { useToast } from '../contexts/ToastContext';

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
  const { toast } = useToast();
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

    if (!error) {
      toast(book ? 'Livro atualizado com sucesso!' : 'Livro adicionado com sucesso!', 'success');
      onClose();
    } else {
      toast('Erro ao salvar livro', 'error');
    }
    setLoading(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={book ? 'Editar Livro' : 'Novo Livro'}
      className="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            id="title"
            label="Título *"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Input
            id="author"
            label="Autor *"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
          />

          <Select
            id="genre"
            label="Gênero"
            value={formData.genre_id}
            onChange={(e) => setFormData({ ...formData, genre_id: e.target.value })}
            options={[
              { label: 'Sem categoria', value: '' },
              ...genres.map(g => ({ label: g.name, value: g.id }))
            ]}
          />

          <Select
            id="status"
            label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
            options={BOOK_STATUS_LIST.map(s => ({ label: s.label, value: s.id }))}
          />

          <Input
            id="total_pages"
            type="number"
            label="Total de Páginas"
            value={formData.total_pages}
            onChange={(e) => setFormData({ ...formData, total_pages: e.target.value })}
          />

          <Input
            id="current_page"
            type="number"
            label="Página Atual"
            value={formData.current_page}
            onChange={(e) => setFormData({ ...formData, current_page: e.target.value })}
          />

          <Input
            id="publication_year"
            type="number"
            label="Ano de Publicação"
            value={formData.publication_year}
            onChange={(e) => setFormData({ ...formData, publication_year: e.target.value })}
          />

          <Input
            id="rating"
            type="number"
            min="0"
            max="5"
            label="Avaliação (0-5)"
            value={formData.personal_rating}
            onChange={(e) => setFormData({ ...formData, personal_rating: e.target.value })}
          />
        </div>

        <div className="relative">
          <Input
            id="cover_url"
            type="url"
            label="URL da Capa"
            value={formData.cover_url}
            onChange={(e) => setFormData({ ...formData, cover_url: e.target.value })}
            placeholder="https://exemplo.com/capa.jpg"
          />
          <Upload className="absolute right-4 top-10 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-text dark:text-text-dark opacity-70">
            Descrição
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-[2rem] focus:ring-2 focus:ring-primary dark:text-cream-50 font-bold transition-all resize-none min-h-[120px] focus:outline-none"
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1 py-5 h-auto rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={loading}
            className="flex-1 py-5 h-auto rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/40"
          >
            {!loading && <Save className="w-4 h-4 mb-0.5 mr-2" />}
            {loading ? 'Salvando...' : 'Salvar Livro'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
