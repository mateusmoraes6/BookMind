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

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [genresData, subcategoriesData] = await Promise.all([
      (supabase.from('genres') as any).select('*').eq('user_id', user.id).order('name'),
      (supabase.from('subcategories') as any).select('*').eq('user_id', user.id).order('name'),
    ]);

    if (genresData.data) setGenres(genresData.data);
    if (subcategoriesData.data) setSubcategories(subcategoriesData.data);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Gêneros e Subcategorias</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Organize suas leituras por categorias personalizadas</p>
        </div>
        <button
          onClick={() => setShowGenreModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Novo Gênero
        </button>
      </div>

      <div className="space-y-3">
        {genres.map((genre) => {
          const genreSubcategories = getGenreSubcategories(genre.id);
          const isExpanded = expandedGenres.has(genre.id);

          return (
            <div key={genre.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleGenre(genre.id)}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    )}
                  </button>
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${genre.color}20` }}
                  >
                    <Tag className="w-5 h-5" style={{ color: genre.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{genre.name}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
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
                <div className="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {genreSubcategories.map((subcategory) => (
                      <div
                        key={subcategory.id}
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3 flex items-center justify-between group hover:shadow-sm transition"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-200">{subcategory.name}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => openEditSubcategory(subcategory)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition"
                            title="Editar"
                          >
                            <Edit2 className="w-3 h-3 text-slate-600 dark:text-slate-300" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubcategory(subcategory.id)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                            title="Excluir"
                          >
                            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedGenre ? 'Editar Gênero' : 'Novo Gênero'}
              </h2>
            </div>
            <form onSubmit={handleSaveGenre} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={genreForm.name}
                  onChange={(e) => setGenreForm({ ...genreForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cor</label>
                <input
                  type="color"
                  value={genreForm.color}
                  onChange={(e) => setGenreForm({ ...genreForm, color: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowGenreModal(false);
                    setSelectedGenre(null);
                    setGenreForm({ name: '', color: '#6366f1', icon: 'book' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                >
                  {selectedGenre ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSubcategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
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
