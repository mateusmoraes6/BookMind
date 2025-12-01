import { useEffect, useState } from 'react';
import { Target, Plus, TrendingUp, BookOpen, Calendar, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Goal {
  id: string;
  goal_type: 'daily_pages' | 'monthly_books' | 'yearly_books';
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
}

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    goal_type: 'daily_pages',
    target_value: '',
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    const { data: goalsData } = await supabase
      .from('reading_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (goalsData) {
      setGoals(goalsData);
      calculateProgress(goalsData);
    }
  };

  const calculateProgress = async (goals: Goal[]) => {
    if (!user) return;

    const progressData: any = {};

    for (const goal of goals) {
      if (goal.goal_type === 'daily_pages') {
        const today = new Date().toISOString().split('T')[0];
        const { data: sessions } = await supabase
          .from('reading_sessions')
          .select('pages_read')
          .eq('user_id', user.id)
          .eq('session_date', today);

        const totalPages = sessions?.reduce((sum, s) => sum + (s.pages_read || 0), 0) || 0;
        progressData[goal.id] = {
          current: totalPages,
          target: goal.target_value,
          percentage: Math.min((totalPages / goal.target_value) * 100, 100),
        };
      } else if (goal.goal_type === 'monthly_books') {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data: books } = await supabase
          .from('books')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfMonth);

        const completed = books?.length || 0;
        progressData[goal.id] = {
          current: completed,
          target: goal.target_value,
          percentage: Math.min((completed / goal.target_value) * 100, 100),
        };
      } else if (goal.goal_type === 'yearly_books') {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const { data: books } = await supabase
          .from('books')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', startOfYear);

        const completed = books?.length || 0;
        progressData[goal.id] = {
          current: completed,
          target: goal.target_value,
          percentage: Math.min((completed / goal.target_value) * 100, 100),
        };
      }
    }

    setProgress(progressData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    let periodStart = new Date();
    let periodEnd = new Date();

    if (formData.goal_type === 'daily_pages') {
      periodStart = new Date();
      periodEnd = new Date();
      periodEnd.setDate(periodEnd.getDate() + 1);
    } else if (formData.goal_type === 'monthly_books') {
      periodStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
      periodEnd = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
    } else if (formData.goal_type === 'yearly_books') {
      periodStart = new Date(periodStart.getFullYear(), 0, 1);
      periodEnd = new Date(periodEnd.getFullYear(), 11, 31);
    }

    await supabase.from('reading_goals').insert({
      user_id: user.id,
      goal_type: formData.goal_type,
      target_value: parseInt(formData.target_value),
      period_start: periodStart.toISOString().split('T')[0],
      period_end: periodEnd.toISOString().split('T')[0],
      is_active: true,
    });

    setShowModal(false);
    setFormData({ goal_type: 'daily_pages', target_value: '' });
    loadGoals();
  };

  const handleDeactivate = async (goalId: string) => {
    await supabase
      .from('reading_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    loadGoals();
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'daily_pages':
        return TrendingUp;
      case 'monthly_books':
        return Calendar;
      case 'yearly_books':
        return Trophy;
      default:
        return Target;
    }
  };

  const getGoalLabel = (type: string) => {
    switch (type) {
      case 'daily_pages':
        return 'Meta Diária de Páginas';
      case 'monthly_books':
        return 'Meta Mensal de Livros';
      case 'yearly_books':
        return 'Meta Anual de Livros';
      default:
        return 'Meta';
    }
  };

  const getGoalUnit = (type: string) => {
    switch (type) {
      case 'daily_pages':
        return 'páginas';
      case 'monthly_books':
      case 'yearly_books':
        return 'livros';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Metas de Leitura</h1>
          <p className="text-slate-600 mt-2">Acompanhe seu progresso e conquiste seus objetivos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
        >
          <Plus className="w-5 h-5" />
          Nova Meta
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Nenhuma meta ativa</h3>
          <p className="text-slate-600 mb-6">
            Defina metas de leitura para acompanhar seu progresso e manter a motivação
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-5 h-5" />
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => {
            const Icon = getGoalIcon(goal.goal_type);
            const progressData = progress[goal.id] || { current: 0, target: 0, percentage: 0 };

            return (
              <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-900 p-3 rounded-lg">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{getGoalLabel(goal.goal_type)}</h3>
                      <p className="text-sm text-slate-600">
                        {goal.target_value} {getGoalUnit(goal.goal_type)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Progresso</span>
                    <span className="font-semibold text-slate-900">
                      {progressData.current} / {progressData.target}
                    </span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progressData.percentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 text-right">
                    {Math.round(progressData.percentage)}% concluído
                  </p>
                </div>

                {progressData.percentage >= 100 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Meta conquistada!</span>
                  </div>
                )}

                <button
                  onClick={() => handleDeactivate(goal.id)}
                  className="w-full py-2 px-4 text-sm text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                >
                  Desativar Meta
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">Nova Meta de Leitura</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Meta</label>
                <select
                  value={formData.goal_type}
                  onChange={(e) => setFormData({ ...formData, goal_type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="daily_pages">Meta Diária de Páginas</option>
                  <option value="monthly_books">Meta Mensal de Livros</option>
                  <option value="yearly_books">Meta Anual de Livros</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Valor da Meta *
                </label>
                <input
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  required
                  min="1"
                  placeholder={
                    formData.goal_type === 'daily_pages'
                      ? 'Ex: 50 páginas por dia'
                      : 'Ex: 2 livros'
                  }
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFormData({ goal_type: 'daily_pages', target_value: '' });
                  }}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
