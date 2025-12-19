import { useEffect, useState } from 'react';
import { Plus, List, Edit2, Trash2, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CustomList {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
}

export default function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<CustomList[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [listBooks, setListBooks] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [showAddBooksModal, setShowAddBooksModal] = useState(false);
  const [selectedList, setSelectedList] = useState<CustomList | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#8b5cf6',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);

    const [listsData, booksData, listBooksData] = await Promise.all([
      (supabase.from('custom_lists') as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      (supabase.from('books') as any).select('*').eq('user_id', user.id),
      (supabase.from('list_books') as any).select('*, books(*), custom_lists(*)'),
    ]);

    if (listsData.data) setLists(listsData.data);
    if (booksData.data) setBooks(booksData.data);

    if (listBooksData.data) {
      const grouped: any = {};
      listBooksData.data.forEach((item: any) => {
        if (!grouped[item.list_id]) {
          grouped[item.list_id] = [];
        }
        grouped[item.list_id].push(item.books);
      });
      setListBooks(grouped);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (selectedList) {
      await (supabase
        .from('custom_lists') as any)
        .update(formData)
        .eq('id', selectedList.id);
    } else {
      await (supabase.from('custom_lists') as any).insert({
        ...formData,
        user_id: user.id,
      });
    }

    setShowModal(false);
    setSelectedList(null);
    setFormData({ name: '', description: '', color: '#8b5cf6' });
    loadData();
  };

  const handleDelete = async (listId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta lista?')) return;
    await (supabase.from('custom_lists') as any).delete().eq('id', listId);
    loadData();
  };

  const handleEdit = (list: CustomList) => {
    setSelectedList(list);
    setFormData({
      name: list.name,
      description: list.description || '',
      color: list.color,
    });
    setShowModal(true);
  };

  const openAddBooks = (list: CustomList) => {
    setSelectedList(list);
    setShowAddBooksModal(true);
  };

  const handleAddBook = async (bookId: string) => {
    if (!selectedList) return;

    await (supabase.from('list_books') as any).insert({
      list_id: selectedList.id,
      book_id: bookId,
    });

    loadData();
  };

  const handleRemoveBook = async (listId: string, bookId: string) => {
    await (supabase
      .from('list_books') as any)
      .delete()
      .eq('list_id', listId)
      .eq('book_id', bookId);

    loadData();
  };

  const getAvailableBooks = () => {
    if (!selectedList) return [];
    const currentBooks = listBooks[selectedList.id] || [];
    const currentBookIds = currentBooks.map((b: any) => b.id);
    return books.filter(b => !currentBookIds.includes(b.id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Listas Personalizadas</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Organize seus livros em coleções customizadas</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Nova Lista
        </button>
      </div>

      {lists.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
          <List className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Nenhuma lista criada</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Crie listas personalizadas para organizar seus livros de forma única
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Lista
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lists.map((list) => {
            const booksInList = listBooks[list.id] || [];
            return (
              <div key={list.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${list.color}20` }}
                      >
                        <List className="w-6 h-6" style={{ color: list.color }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{list.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {booksInList.length} livro{booksInList.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(list)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(list.id)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                  {list.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">{list.description}</p>
                  )}
                </div>

                <div className="p-4">
                  {booksInList.length === 0 ? (
                    <div className="text-center py-8">
                      <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500 dark:text-slate-500 mb-3">Lista vazia</p>
                      <button
                        onClick={() => openAddBooks(list)}
                        className="text-sm text-slate-900 dark:text-white hover:underline"
                      >
                        Adicionar livros
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-3">
                        {booksInList.slice(0, 3).map((book: any) => (
                          <div
                            key={book.id}
                            className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                          >
                            <BookOpen className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                            <span className="text-sm text-slate-700 dark:text-slate-200 truncate flex-1">{book.title}</span>
                            <button
                              onClick={() => handleRemoveBook(list.id, book.id)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                              title="Remover"
                            >
                              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {booksInList.length > 3 && (
                        <p className="text-xs text-slate-500 dark:text-slate-500 mb-3">
                          +{booksInList.length - 3} outros livros
                        </p>
                      )}
                      <button
                        onClick={() => openAddBooks(list)}
                        className="w-full py-2 px-4 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition"
                      >
                        Adicionar mais livros
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedList ? 'Editar Lista' : 'Nova Lista'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Cor</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full h-12 rounded-lg cursor-pointer"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedList(null);
                    setFormData({ name: '', description: '', color: '#8b5cf6' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
                >
                  {selectedList ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddBooksModal && selectedList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-200 dark:border-slate-700">
            <div className="sticky top-0 bg-white dark:bg-slate-800 p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Adicionar Livros</h2>
              <button
                onClick={() => {
                  setShowAddBooksModal(false);
                  setSelectedList(null);
                }}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {getAvailableBooks().length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">Todos os livros já estão nesta lista</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAvailableBooks().map((book) => (
                    <button
                      key={book.id}
                      onClick={() => handleAddBook(book.id)}
                      className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition text-left"
                    >
                      <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">{book.title}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{book.author}</p>
                      </div>
                      <Plus className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
