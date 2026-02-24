import { useEffect, useState } from 'react';
import {
  Target, Plus, TrendingUp, Calendar, Trophy, X, CheckCircle2, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type GoalType =
  | 'daily_pages'
  | 'monthly_books'
  | 'yearly_books';

interface Goal {
  id: string;
  goal_type: GoalType;
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
}

interface ProgressData {
  current: number;
  target: number;
  percentage: number;
}

// ─── Config de cada tipo de meta ──────────────────────────────────────────────
const GOAL_CONFIGS: Record<
  GoalType,
  { label: string; unit: string; period: string; icon: any; color: string; gradient: string; emoji: string }
> = {
  daily_pages: {
    label: 'Páginas por Dia',
    unit: 'páginas',
    period: 'Diária',
    icon: TrendingUp,
    color: '#a78bfa',
    gradient: 'from-violet-500 to-purple-600',
    emoji: '📄',
  },
  monthly_books: {
    label: 'Livros no Mês',
    unit: 'livros',
    period: 'Mensal',
    icon: Calendar,
    color: '#4ade80',
    gradient: 'from-green-500 to-emerald-600',
    emoji: '📅',
  },
  yearly_books: {
    label: 'Livros no Ano',
    unit: 'livros',
    period: 'Anual',
    icon: Trophy,
    color: '#fbbf24',
    gradient: 'from-amber-500 to-yellow-400',
    emoji: '🏆',
  },
};

const PERIODS = ['Diária', 'Mensal', 'Anual'] as const;

// ─── Presets rápidos ──────────────────────────────────────────────────────────
const PRESETS: { label: string; type: GoalType; value: number; emoji: string }[] = [
  { label: '20 pág/dia', type: 'daily_pages', value: 20, emoji: '📄' },
  { label: '50 pág/dia', type: 'daily_pages', value: 50, emoji: '📄' },
  { label: '2 livros/mês', type: 'monthly_books', value: 2, emoji: '📅' },
  { label: '4 livros/mês', type: 'monthly_books', value: 4, emoji: '📅' },
  { label: '12 livros/ano', type: 'yearly_books', value: 12, emoji: '🏆' },
  { label: '24 livros/ano', type: 'yearly_books', value: 24, emoji: '🏆' },
];

// ─── SVG: Anel de progresso ───────────────────────────────────────────────────
function ProgressRing({
  percentage,
  color,
  size = 76,
  strokeWidth = 7,
}: {
  percentage: number;
  color: string;
  size?: number;
  strokeWidth?: number;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="currentColor" strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
    </svg>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [progress, setProgress] = useState<Record<string, ProgressData>>({});
  const [showModal, setShowModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{ goal_type: GoalType; target_value: string }>({
    goal_type: 'daily_pages',
    target_value: '',
  });

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  // ── Carregar metas ──────────────────────────────────────────────────────────
  const loadGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await (supabase.from('reading_goals') as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setGoals(data);
      await calculateProgress(data);
    }
    setLoading(false);
  };

  // ── Calcular progresso de cada meta ────────────────────────────────────────
  const calculateProgress = async (goalList: Goal[]) => {
    if (!user) return;
    const result: Record<string, ProgressData> = {};

    for (const goal of goalList) {
      const target = goal.target_value;
      let current = 0;

      if (goal.goal_type === 'daily_pages') {
        const today = new Date().toISOString().split('T')[0];
        const { data } = await (supabase.from('reading_sessions') as any)
          .select('pages_read').eq('user_id', user.id).eq('session_date', today);
        current = data?.reduce((s: number, r: any) => s + (r.pages_read || 0), 0) || 0;

      } else if (goal.goal_type === 'monthly_books') {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        const { data } = await (supabase.from('books') as any)
          .select('id').eq('user_id', user.id).eq('status', 'completed').gte('completed_at', monthStart);
        current = data?.length || 0;

      } else if (goal.goal_type === 'yearly_books') {
        const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
        const { data } = await (supabase.from('books') as any)
          .select('id').eq('user_id', user.id).eq('status', 'completed').gte('completed_at', yearStart);
        current = data?.length || 0;
      }

      result[goal.id] = {
        current,
        target,
        percentage: Math.min((current / target) * 100, 100),
      };
    }

    setProgress(result);
  };

  // ── Criar nova meta ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const now = new Date();
    let periodStart = now;
    let periodEnd = new Date(now);

    switch (formData.goal_type) {
      case 'daily_pages':
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case 'monthly_books':
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly_books':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
    }

    if (editingGoalId) {
      const { error } = await (supabase.from('reading_goals') as any)
        .update({
          goal_type: formData.goal_type,
          target_value: parseInt(formData.target_value),
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0],
        })
        .eq('id', editingGoalId);

      if (error) {
        console.error('Error updating goal:', error);
        alert(`Erro ao atualizar meta: ${error.message}`);
        return;
      }
    } else {
      const { error } = await (supabase.from('reading_goals') as any).insert({
        user_id: user.id,
        goal_type: formData.goal_type,
        target_value: parseInt(formData.target_value),
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        is_active: true,
      });

      if (error) {
        console.error('Error creating goal:', error);
        alert(`Erro ao criar meta: ${error.message}`);
        return;
      }
    }

    setShowModal(false);
    setEditingGoalId(null);
    setFormData({ goal_type: 'daily_pages', target_value: '' });
    loadGoals();
  };

  // ── Desativar meta ──────────────────────────────────────────────────────────
  const handleDeactivate = async (goalId: string) => {
    await (supabase.from('reading_goals') as any)
      .update({ is_active: false })
      .eq('id', goalId);
    loadGoals();
  };

  // ── Editar meta ─────────────────────────────────────────────────────────────
  const handleEditClicked = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setFormData({
      goal_type: goal.goal_type,
      target_value: String(goal.target_value),
    });
    setShowModal(true);
  };

  // ── Preset rápido ───────────────────────────────────────────────────────────
  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setFormData({ goal_type: p.type, target_value: String(p.value) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Carregando metas...</p>
        </div>
      </div>
    );
  }

  // Agrupar metas por período
  const byPeriod = PERIODS.reduce<Record<string, Goal[]>>((acc, period) => {
    acc[period] = goals.filter((g) => GOAL_CONFIGS[g.goal_type]?.period === period);
    return acc;
  }, {});

  const selectedConfig = GOAL_CONFIGS[formData.goal_type];

  return (
    <div className="space-y-8 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Metas de Leitura</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {goals.length} meta{goals.length !== 1 ? 's' : ''} ativa{goals.length !== 1 ? 's' : ''} · conquiste seus objetivos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* ── Estado vazio ── */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Nenhuma meta ativa
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto text-sm">
            Crie micro-metas diárias e semanais para manter o ritmo e celebrar cada conquista!
          </p>
          {/* Sugestões rápidas no empty state */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.label}
                onClick={() => { applyPreset(p); setShowModal(true); }}
                className="text-sm px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Meta
          </button>
        </div>
      ) : (
        /* ── Metas agrupadas por período ── */
        <div className="space-y-8">
          {PERIODS.map((period) => {
            const periodGoals = byPeriod[period];
            if (!periodGoals || periodGoals.length === 0) return null;

            const periodEmoji = { Diária: '☀️', Semanal: '📅', Mensal: '🗓️', Anual: '🌟' }[period];

            return (
              <section key={period}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-base">{periodEmoji}</span>
                  <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    {period}
                  </h2>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {periodGoals.map((goal) => {
                    const cfg = GOAL_CONFIGS[goal.goal_type];
                    const p = progress[goal.id] ?? { current: 0, target: goal.target_value, percentage: 0 };
                    const done = p.percentage >= 100;
                    const Icon = cfg.icon;

                    return (
                      <div
                        key={goal.id}
                        className={`relative bg-white dark:bg-slate-800 rounded-2xl border transition-all duration-300 overflow-hidden ${done
                          ? 'border-green-400/50 dark:border-green-500/40 shadow-lg shadow-green-500/10'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                          }`}
                      >
                        {/* Barra de cor no topo */}
                        <div
                          className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`}
                          style={{ opacity: done ? 1 : 0.6 }}
                        />

                        <div className="p-5">
                          {/* Header do card */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="p-2.5 rounded-xl"
                                style={{ backgroundColor: `${cfg.color}18` }}
                              >
                                <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                  {cfg.emoji} {cfg.period}
                                </p>
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">
                                  {cfg.label}
                                </h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditClicked(goal)}
                                className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                                title="Editar meta"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeactivate(goal.id)}
                                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Desativar meta"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Anel + números */}
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <ProgressRing
                                percentage={p.percentage}
                                color={done ? '#22c55e' : cfg.color}
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {done ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                                    {Math.round(p.percentage)}%
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex-1">
                              <div className="flex items-baseline gap-1 mb-1">
                                <span
                                  className="text-3xl font-black"
                                  style={{ color: done ? '#22c55e' : cfg.color }}
                                >
                                  {p.current}
                                </span>
                                <span className="text-slate-400 dark:text-slate-500 text-sm font-medium">
                                  / {p.target} {cfg.unit}
                                </span>
                              </div>

                              {/* Barra fina */}
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${done ? 'from-green-400 to-emerald-500' : cfg.gradient
                                    }`}
                                  style={{ width: `${p.percentage}%` }}
                                />
                              </div>

                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {done
                                  ? 'Meta concluída! 🎉'
                                  : `Faltam ${p.target - p.current} ${cfg.unit}`}
                              </p>
                            </div>
                          </div>

                          {/* Badge de conquista */}
                          {done && (
                            <div className="mt-4 flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl px-3 py-2">
                              <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-xs font-semibold text-green-700 dark:text-green-400">
                                Parabéns! Meta conquistada!
                              </span>
                              <span className="ml-auto text-base">🎉</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ── Modal: Nova Meta ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header com Gradiente */}
            <div className={`bg-gradient-to-r ${selectedConfig.gradient} p-6 flex-shrink-0 relative overflow-hidden`}>
              {/* Decorativo */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/20">
                    <selectedConfig.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">
                      {editingGoalId ? 'Editar Meta' : 'Nova Meta'}
                    </h2>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{selectedConfig.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingGoalId(null);
                    setFormData({ goal_type: 'daily_pages', target_value: '' });
                  }}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="overflow-y-auto flex-1 p-6 space-y-8 custom-scrollbar bg-white dark:bg-slate-800">
              {/* Seção 1: Presets */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                  ⚡ Sugestões Rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`text-[13px] px-4 py-2 rounded-xl font-bold transition-all ${formData.goal_type === p.type && formData.target_value === String(p.value)
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent'
                        }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Seção 2: Escolha de Tipo */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                  🎯 Personalizar Objetivo
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(GOAL_CONFIGS) as [GoalType, typeof GOAL_CONFIGS[GoalType]][]).map(
                    ([type, cfg]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, goal_type: type }))}
                        className={`flex flex-col gap-2 p-3.5 rounded-2xl border-2 text-left transition-all group ${formData.goal_type === type
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20'
                          : 'border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50/30 dark:bg-slate-800/20'
                          }`}
                      >
                        <div
                          className="p-2 rounded-xl w-fit transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${cfg.color}15` }}
                        >
                          <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                            {cfg.label}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{cfg.period}</p>
                        </div>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Seção 3: Valor */}
              <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-4">
                  🔢 Valor da Meta
                </p>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Target className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData((f) => ({ ...f, target_value: e.target.value }))}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:text-white text-xl font-bold transition-all shadow-inner"
                    required
                    min="1"
                    placeholder={`Ex: ${selectedConfig.unit === 'páginas' ? '30' : '2'}`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {selectedConfig.unit}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Fixo */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 flex gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingGoalId(null);
                  setFormData({ goal_type: 'daily_pages', target_value: '' });
                }}
                className="flex-1 px-6 py-4 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-600 transition-all font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="goal-form"
                onClick={handleSubmit as any}
                className={`flex-[1.5] px-6 py-4 bg-gradient-to-r ${selectedConfig.gradient} text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all hover:opacity-90 active:scale-95 shadow-indigo-500/20`}
              >
                {editingGoalId ? 'Salvar Alterações' : 'Ativar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
