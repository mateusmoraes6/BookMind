import { useEffect, useState } from 'react';
import { Plus, Tag, Edit2, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Genre {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
}

interface Subcategory {
  id: string;
  genre_id: string;
  name: string;
}

export default function Genres() {
  const { user } = useAuth();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [expandedGenres, setExpandedGenres] = useState<Set<string>>(new Set());
  const [showGenreModal, setShowGenreModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  const [genreForm, setGenreForm] = useState({ name: '', color: '#6366f1', icon: 'book' });
  const [subcategoryForm, setSubcategoryForm] = useState({ name: '', genre_id: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    const [genresData, subcategoriesData] = await Promise.all([
      (supabase.from('genres') as any).select('*').eq('user_id', user.id).order('name'),
      (supabase.from('subcategories') as any).select('*').eq('user_id', user.id).order('name'),
    ]);

    if (genresData.data) setGenres(genresData.data);
    if (subcategoriesData.data) setSubcategories(subcategoriesData.data);

    setLoading(false);
  };

  const toggleGenre = (genreId: string) => {
    const newExpanded = new Set(expandedGenres);
    if (newExpanded.has(genreId)) {
      newExpanded.delete(genreId);
    } else {
      newExpanded.add(genreId);
    }
    setExpandedGenres(newExpanded);
  };

  const handleSaveGenre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedGenre) {
      await (supabase
        .from('genres') as any)
        .update(genreForm)
        .eq('id', selectedGenre.id);
    } else {
      await (supabase.from('genres') as any).insert({
        ...genreForm,
        user_id: user.id,
      });
    }

    setShowGenreModal(false);
    setSelectedGenre(null);
    setGenreForm({ name: '', color: '#6366f1', icon: 'book' });
    loadData();
  };

  const handleSaveSubcategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedSubcategory) {
      await (supabase
        .from('subcategories') as any)
        .update({ name: subcategoryForm.name })
        .eq('id', selectedSubcategory.id);
    } else {
      await (supabase.from('subcategories') as any).insert({
        ...subcategoryForm,
        user_id: user.id,
      });
    }

    setShowSubcategoryModal(false);
    setSelectedSubcategory(null);
    setSubcategoryForm({ name: '', genre_id: '' });
    loadData();
  };

  const handleDeleteGenre = async (genreId: string) => {
    if (!confirm('Tem certeza? Isto removerá todas as subcategorias deste gênero.')) return;
    await (supabase.from('genres') as any).delete().eq('id', genreId);
    loadData();
  };

  const handleDeleteSubcategory = async (subcategoryId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta subcategoria?')) return;
    await (supabase.from('subcategories') as any).delete().eq('id', subcategoryId);
    loadData();
  };

  const openEditGenre = (genre: Genre) => {
    setSelectedGenre(genre);
    setGenreForm({ name: genre.name, color: genre.color, icon: genre.icon });
    setShowGenreModal(true);
  };

  const openEditSubcategory = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setSubcategoryForm({ name: subcategory.name, genre_id: subcategory.genre_id });
    setShowSubcategoryModal(true);
  };

  const openAddSubcategory = (genreId: string) => {
    setSubcategoryForm({ name: '', genre_id: genreId });
    setShowSubcategoryModal(true);
  };

  const getGenreSubcategories = (genreId: string) => {
    return subcategories.filter(sub => sub.genre_id === genreId);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50 tracking-tight leading-tight">Gêneros e Subcategorias</h1>
          <p className="text-slate-500 dark:text-cream-200/40 mt-1 text-sm font-medium tracking-wide">Organize suas leituras por categorias personalizadas</p>
        </div>
        <button
          onClick={() => setShowGenreModal(true)}
          className="flex items-center justify-center gap-3 px-8 py-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-[1.25rem] transition-all shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest transform active:scale-95 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5 mb-0.5" />
          Novo Gênero
        </button>
      </div>

      <div className="space-y-3">
        {genres.map((genre) => {
          const genreSubcategories = getGenreSubcategories(genre.id);
          const isExpanded = expandedGenres.has(genre.id);

          return (
            <div key={genre.id} className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 overflow-hidden group">
              <div className="p-6 flex items-center justify-between relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-cream-100/10" />
                <div className="flex items-center gap-4 flex-1 relative z-10">
                  <button
                    onClick={() => toggleGenre(genre.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-all"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-400 dark:text-cream-200/20" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-400 dark:text-cream-200/20" />
                    )}
                  </button>
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border border-current shadow-sm"
                    style={{ backgroundColor: `${genre.color}15`, color: genre.color }}
                  >
                    <Tag className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900 dark:text-cream-100 tracking-tight">{genre.name}</h3>
                    <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-cream-200/50 mt-1">
                      {genreSubcategories.length} subcategoria{genreSubcategories.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openAddSubcategory(genre.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-600 dark:text-slate-400"
                    title="Adicionar subcategoria"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditGenre(genre)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-slate-600 dark:text-slate-400"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {!genre.is_default && (
                    <button
                      onClick={() => handleDeleteGenre(genre.id)}
                      className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-red-600 dark:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {isExpanded && genreSubcategories.length > 0 && (
                <div className="border-t border-slate-100 dark:border-dark-800 p-8 bg-slate-50/50 dark:bg-dark-950/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {genreSubcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="bg-white dark:bg-dark-900 border border-slate-100 dark:border-dark-800 rounded-2xl p-4 flex items-center justify-between group/sub hover:shadow-md hover:border-dark-600 transition-all duration-300"
                      >
                        <span className="text-sm font-bold text-slate-700 dark:text-cream-200/60 leading-tight">{subcategory.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-all translate-x-2 group-hover/sub:translate-x-0">
                          <button
                            onClick={() => openEditSubcategory(subcategory)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-all text-slate-400 dark:text-cream-200/20"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all text-red-400/30 hover:text-red-400"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showGenreModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-md w-full border border-slate-200 dark:border-dark-800 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-dark-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">
                {selectedGenre ? 'Editar Gênero' : 'Novo Gênero'}
              </h2>
            </div>
            <form onSubmit={handleSaveGenre} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">Nome *</label>
                <input
                  type="text"
                  value={genreForm.name}
                  onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
                  className="w-full px-5 py-4 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black text-lg transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-black text-slate-500 dark:text-cream-200/20 tracking-[0.2em] mb-3">Cor</label>
                <input
                  type="color"
                  value={genreForm.color}
                  onChange={(e) => setGenreForm({ ...genreForm, color: e.target.value })}
                  className="w-full h-16 rounded-2xl cursor-pointer bg-dark-950 p-1 border border-dark-700"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenreModal(false);
                    setSelectedGenre(null);
                    setGenreForm({ name: '', color: '#6366f1', icon: 'book' });
                  }}
                  className="flex-1 px-6 py-4 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-cream-200/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-dark-700 transition-all font-black text-xs uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-cream-100 text-dark-950 rounded-2xl hover:bg-cream-50 transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transform active:scale-[0.98]"
                >
                  {selectedGenre ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-md w-full border border-slate-200 dark:border-dark-800 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-100 dark:border-dark-800">
              <h2 className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight">
                {selectedSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria'}
              </h2>
            </div>
            <form onSubmit={handleSaveSubcategory} className="p-6 space-y-4">
              {!selectedSubcategory && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gênero *</label>
                  <select
                    value={subcategoryForm.genre_id}
                    onChange={(e) => setSubcategoryForm({ ...subcategoryForm, genre_id: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                    required
                  >
                    <option value="">Selecione um gênero</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={subcategoryForm.name}
                  onChange={(e) => setSubcategoryForm({ ...subcategoryForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowSubcategoryModal(false);
                    setSelectedSubcategory(null);
                    setSubcategoryForm({ name: '', genre_id: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                >
                  {selectedSubcategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
