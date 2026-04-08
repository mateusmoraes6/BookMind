import { useEffect, useState } from 'react';
import {
  Target, Plus, TrendingUp, Calendar, Trophy, X, CheckCircle2, Pencil,
  BookOpen, BookMarked, Flame, Zap, Clock, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalDateISO, getMonthRange, getDaysInMonth } from '../lib/dateUtils';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type GoalType = 'daily_pages' | 'monthly_books' | 'yearly_books';
type Pace = 'completed' | 'ahead' | 'on_track' | 'behind';

interface Goal {
  id: string;
  goal_type: GoalType;
  target_value: number;
  period_start: string;
  period_end: string;
  is_active: boolean;
}

interface BookSummary {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  /** true = livro foi iniciado antes deste mês (flag visual) */
  started_in_different_month: boolean;
}

interface ProgressData {
  current: number;
  target: number;
  percentage: number;
  // Dados extras para metas mensais/anuais
  started?: number;
  startedList?: BookSummary[];
  completedList?: BookSummary[];
  inProgressThisMonth?: BookSummary[];
  daysRemaining?: number;
  pace?: Pace;
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
    color: '#a855f7',
    gradient: 'from-violet-400 to-purple-600',
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

const PRESETS: { label: string; type: GoalType; value: number; emoji: string }[] = [
  { label: '20 pág/dia', type: 'daily_pages', value: 20, emoji: '📄' },
  { label: '50 pág/dia', type: 'daily_pages', value: 50, emoji: '📄' },
  { label: '2 livros/mês', type: 'monthly_books', value: 2, emoji: '📅' },
  { label: '4 livros/mês', type: 'monthly_books', value: 4, emoji: '📅' },
  { label: '12 livros/ano', type: 'yearly_books', value: 12, emoji: '🏆' },
  { label: '24 livros/ano', type: 'yearly_books', value: 24, emoji: '🏆' },
];

// ─── Informações de Ritmo ─────────────────────────────────────────────────────
const PACE_CONFIG: Record<Pace, { label: string; color: string; bg: string; icon: any }> = {
  completed: { label: 'Meta conquistada!', color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 },
  ahead: { label: 'Você está adiantado!', color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: Zap },
  on_track: { label: 'No ritmo certo', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: TrendingUp },
  behind: { label: 'Acelere o ritmo!', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: Clock },
};

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
        className="text-slate-200 dark:text-dark-800"
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

// ─── Mini-card de livro ───────────────────────────────────────────────────────
function BookMiniCard({ book, type }: { book: BookSummary; type: 'completed' | 'started' }) {
  const pct = book.total_pages > 0
    ? Math.round((book.current_page / book.total_pages) * 100)
    : 0;

  const dateLabel = type === 'completed'
    ? book.completed_at
      ? new Date(book.completed_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : ''
    : book.started_at
      ? new Date(book.started_at + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
      : '';

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Capa miniatura */}
      <div className="w-8 h-11 rounded-md overflow-hidden flex-shrink-0 bg-slate-200 dark:bg-dark-800">
        {book.cover_url ? (
          <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-900 dark:text-cream-100 truncate leading-tight">
          {book.title}
        </p>
        <p className="text-[10px] text-slate-400 dark:text-cream-200/30 truncate">{book.author}</p>

        {/* Barra de progresso para livros em andamento */}
        {type === 'started' && book.status === 'in_progress' && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-slate-200 dark:bg-dark-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-cream-200/30">{pct}%</span>
          </div>
        )}
      </div>

      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-[10px] text-slate-400 dark:text-cream-200/30">{dateLabel}</span>
        {/* Flag anti-exploração: livro finalizado mas iniciado em outro mês */}
        {type === 'completed' && book.started_in_different_month && (
          <span
            title="Iniciado em outro mês"
            className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full"
          >
            ↗ outro mês
          </span>
        )}
      </div>
    </div>
  );
}

function MonthlyGoalCard({
  goal,
  p,
  cfg,
  onEdit,
  onDeactivate,
}: {
  goal: Goal;
  p: ProgressData;
  cfg: typeof GOAL_CONFIGS[GoalType];
  onEdit: () => void;
  onDeactivate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const done = p.percentage >= 100;
  const pace = p.pace ?? 'on_track';
  const paceInfo = PACE_CONFIG[pace];
  const PaceIcon = paceInfo.icon;
  const Icon = cfg.icon;

  const hasBookData =
    (p.completedList && p.completedList.length > 0) ||
    (p.startedList && p.startedList.length > 0) ||
    (p.inProgressThisMonth && p.inProgressThisMonth.length > 0);

  return (
    <div
      className={`relative bg-white dark:bg-dark-900 rounded-3xl border transition-all duration-300 overflow-hidden group ${done
          ? 'border-green-400/50 dark:border-green-500/20 shadow-xl shadow-green-500/5'
          : 'border-slate-200 dark:border-dark-800 hover:border-slate-300 dark:hover:border-dark-700 hover:shadow-2xl'
        }`}
    >
      {/* Barra de cor no topo */}
      <div
        className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`}
        style={{ opacity: done ? 1 : 0.6 }}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${cfg.color}18` }}>
              <Icon className="w-5 h-5" style={{ color: cfg.color }} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-cream-200/30 uppercase tracking-widest mb-0.5">
                {cfg.emoji} {cfg.period}
              </p>
              <h3 className="font-black text-slate-900 dark:text-cream-50 text-sm leading-tight">
                {cfg.label}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onEdit}
              className="p-2 text-slate-400 hover:text-dark-950 hover:bg-cream-100/80 dark:hover:text-dark-950 dark:hover:bg-cream-100 transition-all rounded-xl"
              aria-label="Editar meta"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeactivate}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all rounded-xl"
              aria-label="Desativar meta"
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
                className="text-4xl font-black tracking-tighter"
                style={{ color: done ? '#22c55e' : cfg.color }}
              >
                {p.current}
              </span>
              <span className="text-slate-400 dark:text-cream-200/20 text-xs font-bold uppercase tracking-widest mb-1.5 ml-1">
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

            {/* Indicador de ritmo */}
            <div className={`flex items-center gap-1.5 mt-2 ${paceInfo.color}`}>
              <PaceIcon className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {paceInfo.label}
              </span>
            </div>
          </div>
        </div>

        {/* Métricas complementares: iniciados e dias restantes */}
        {(p.started !== undefined || p.daysRemaining !== undefined) && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-dark-800">
            {p.started !== undefined && (
              <div className="flex items-center gap-1.5 flex-1">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-cream-200/30 uppercase tracking-wider">
                    Iniciados
                  </p>
                  <p className="text-sm font-black text-slate-700 dark:text-cream-100">
                    {p.started}
                  </p>
                </div>
              </div>
            )}

            {p.daysRemaining !== undefined && p.daysRemaining > 0 && !done && (
              <div className="flex items-center gap-1.5 flex-1">
                <div className="p-1.5 rounded-lg bg-slate-500/10">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-cream-200/30 uppercase tracking-wider">
                    Restam
                  </p>
                  <p className="text-sm font-black text-slate-700 dark:text-cream-100">
                    {p.daysRemaining}d
                  </p>
                </div>
              </div>
            )}

            {/* Botão expandir */}
            {hasBookData && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-cream-200/30 uppercase tracking-wider hover:text-slate-600 dark:hover:text-cream-100 transition-colors ml-auto"
                aria-expanded={expanded}
                aria-label={expanded ? 'Ver menos detalhes' : 'Ver detalhes da meta'}
              >
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {expanded ? 'Menos' : 'Detalhes'}
              </button>
            )}
          </div>
        )}

        {/* Breakdown expandível */}
        {expanded && hasBookData && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* Livros finalizados */}
            {p.completedList && p.completedList.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookMarked className="w-3.5 h-3.5 text-green-500" />
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    Finalizados ({p.completedList.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-dark-800">
                  {p.completedList.map(book => (
                    <BookMiniCard key={book.id} book={book} type="completed" />
                  ))}
                </div>
              </div>
            )}

            {/* Livros em andamento iniciados este mês */}
            {p.inProgressThisMonth && p.inProgressThisMonth.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Em andamento — iniciados este mês ({p.inProgressThisMonth.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-dark-800">
                  {p.inProgressThisMonth.map(book => (
                    <BookMiniCard key={book.id} book={book} type="started" />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Badge de conquista */}
        {done && (
          <div className="mt-4 flex items-center gap-3 bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
            <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">
              Meta conquistada!
            </span>
            <span className="ml-auto text-base">🎉</span>
          </div>
        )}
      </div>
    </div>
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

  // Accessibility: ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEditingGoalId(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
    const now = new Date();

    for (const goal of goalList) {
      const target = goal.target_value;
      let pd: ProgressData = { current: 0, target, percentage: 0 };

      // ── META DIÁRIA: Páginas lidas hoje ────────────────────────────────────
      if (goal.goal_type === 'daily_pages') {
        const today = getLocalDateISO();
        const { data } = await (supabase.from('reading_sessions') as any)
          .select('pages_read')
          .eq('user_id', user.id)
          .eq('session_date', today);
        const current = data?.reduce((s: number, r: any) => s + (r.pages_read || 0), 0) || 0;
        pd = { current, target, percentage: Math.min((current / target) * 100, 100) };

        // ── META MENSAL: Livros FINALIZADOS no mês corrente ───────────────────
      } else if (goal.goal_type === 'monthly_books') {
        const year = now.getFullYear();
        const month = now.getMonth();
        const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
        const totalDays = getDaysInMonth(year, month);
        const dayOfMonth = now.getDate();
        const daysRemaining = totalDays - dayOfMonth;

        // 1. Livros FINALIZADOS neste mês → contam para a meta
        const { data: completedData } = await (supabase.from('books') as any)
          .select('id, title, author, cover_url, total_pages, current_page, started_at, completed_at, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', monthStart)
          .lte('completed_at', monthEnd);

        // 2. Livros INICIADOS neste mês → métrica complementar
        const { data: startedData } = await (supabase.from('books') as any)
          .select('id, title, author, cover_url, total_pages, current_page, started_at, completed_at, status')
          .eq('user_id', user.id)
          .not('started_at', 'is', null)
          .gte('started_at', monthStart)
          .lte('started_at', monthEnd);

        const completedList: BookSummary[] = (completedData || []).map((b: any) => ({
          ...b,
          // Flag visual: o livro foi finalizado neste mês, mas iniciado num mês anterior?
          started_in_different_month: b.started_at
            ? b.started_at < monthStart
            : false,
        }));

        const startedList: BookSummary[] = (startedData || []).map((b: any) => ({
          ...b,
          started_in_different_month: false,
        }));

        const inProgressThisMonth = startedList.filter(b => b.status === 'in_progress');
        const completedCount = completedList.length;

        // Cálculo de ritmo
        const expectedByNow = (target / totalDays) * dayOfMonth;
        let pace: Pace;
        if (completedCount >= target) pace = 'completed';
        else if (completedCount >= expectedByNow) pace = 'ahead';
        else if (completedCount >= expectedByNow * 0.6) pace = 'on_track';
        else pace = 'behind';

        pd = {
          current: completedCount,
          target,
          percentage: Math.min((completedCount / target) * 100, 100),
          started: startedList.length,
          startedList,
          completedList,
          inProgressThisMonth,
          daysRemaining,
          pace,
        };

        // ── META ANUAL: Livros FINALIZADOS no ano corrente ────────────────────
      } else if (goal.goal_type === 'yearly_books') {
        const year = now.getFullYear();
        const yearStart = `${year}-01-01`;
        const yearEnd = `${year}-12-31`;
        const dayOfYear = Math.floor(
          (now.getTime() - new Date(year, 0, 0).getTime()) / 86400000
        );
        const totalDays = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
        const daysRemaining = totalDays - dayOfYear;

        const { data: completedData } = await (supabase.from('books') as any)
          .select('id, title, author, cover_url, total_pages, current_page, started_at, completed_at, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', yearStart)
          .lte('completed_at', yearEnd);

        const { data: startedData } = await (supabase.from('books') as any)
          .select('id')
          .eq('user_id', user.id)
          .not('started_at', 'is', null)
          .gte('started_at', yearStart)
          .lte('started_at', yearEnd);

        const completedList: BookSummary[] = (completedData || []).map((b: any) => ({
          ...b,
          started_in_different_month: false,
        }));
        const completedCount = completedList.length;

        const expectedByNow = (target / totalDays) * dayOfYear;
        let pace: Pace;
        if (completedCount >= target) pace = 'completed';
        else if (completedCount >= expectedByNow) pace = 'ahead';
        else if (completedCount >= expectedByNow * 0.6) pace = 'on_track';
        else pace = 'behind';

        pd = {
          current: completedCount,
          target,
          percentage: Math.min((completedCount / target) * 100, 100),
          started: startedData?.length || 0,
          completedList,
          daysRemaining,
          pace,
        };
      }

      result[goal.id] = pd;
    }

    setProgress(result);
  };

  // ── Criar / Editar meta ─────────────────────────────────────────────────────
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
      case 'monthly_books': {
        const year = now.getFullYear();
        const month = now.getMonth();
        periodStart = new Date(year, month, 1);
        periodEnd = new Date(year, month + 1, 0); // último dia do mês
        break;
      }
      case 'yearly_books':
        periodStart = new Date(now.getFullYear(), 0, 1);
        periodEnd = new Date(now.getFullYear(), 11, 31);
        break;
    }

    const payload = {
      goal_type: formData.goal_type,
      target_value: parseInt(formData.target_value),
      period_start: getLocalDateISO(periodStart),
      period_end: getLocalDateISO(periodEnd),
    };

    if (editingGoalId) {
      const { error } = await (supabase.from('reading_goals') as any)
        .update(payload)
        .eq('id', editingGoalId);
      if (error) { console.error(error); return; }
    } else {
      const { error } = await (supabase.from('reading_goals') as any).insert({
        user_id: user.id,
        ...payload,
        is_active: true,
      });
      if (error) { console.error(error); return; }
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
    setFormData({ goal_type: goal.goal_type, target_value: String(goal.target_value) });
    setShowModal(true);
  };

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setFormData({ goal_type: p.type, target_value: String(p.value) });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-cream-100 border-t-transparent" />
          <p className="text-sm text-slate-400 dark:text-cream-200/30">Carregando metas...</p>
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

  // Verificar se há alguma meta mensal com streak (simplificado)
  const hasMonthlyGoal = byPeriod['Mensal']?.length > 0;

  return (
    <div className="space-y-8 pb-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-cream-50">Metas de Leitura</h1>
          <p className="text-slate-500 dark:text-cream-200/40 mt-1 text-sm font-medium">
            {goals.length} meta{goals.length !== 1 ? 's' : ''} ativa{goals.length !== 1 ? 's' : ''} · conquiste seus objetivos
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest w-full sm:w-auto transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* ── Legenda explicativa (metas mensais) ── */}
      {hasMonthlyGoal && (
        <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-dark-900 rounded-2xl border border-slate-100 dark:border-dark-800">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-cream-200/40">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Finalizados = contam para a meta
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-cream-200/40">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            Iniciados = esforço do mês (complementar)
          </div>
        </div>
      )}

      {/* ── Estado vazio ── */}
      {goals.length === 0 ? (
        <div className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10 w-16 h-16 bg-cream-100/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cream-100/10">
            <Target className="w-8 h-8 text-cream-100" />
          </div>
          <h3 className="text-xl font-black text-slate-900 dark:text-cream-100 mb-2">
            Nenhuma meta ativa
          </h3>
          <p className="text-slate-500 dark:text-cream-200/40 mb-8 max-w-sm mx-auto text-sm font-medium">
            Crie metas diárias, mensais e anuais para manter o ritmo e celebrar cada conquista!
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {PRESETS.slice(0, 4).map((p) => (
              <button
                key={p.label}
                onClick={() => { applyPreset(p); setShowModal(true); }}
                className="text-xs px-4 py-2 bg-slate-100 dark:bg-dark-800 text-slate-700 dark:text-cream-100 rounded-xl hover:bg-cream-100 dark:hover:bg-cream-100 hover:text-dark-950 dark:hover:text-dark-950 transition-all font-bold uppercase tracking-wider border border-transparent dark:border-dark-700"
              >
                {p.emoji} {p.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition shadow-xl shadow-black/20 font-black text-xs uppercase tracking-widest"
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

            const periodEmoji = { Diária: '☀️', Mensal: '🗓️', Anual: '🌟' }[period];

            return (
              <section key={period}>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-base">{periodEmoji}</span>
                  <h2 className="text-xs font-black text-slate-500 dark:text-cream-200/30 uppercase tracking-[0.2em]">
                    {period}
                  </h2>
                  <div className="flex-1 h-px bg-slate-100 dark:bg-dark-800" />
                  {/* Streak icon (placeholder — expandir com histórico real) */}
                  {period === 'Mensal' && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-wider">streak</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {periodGoals.map((goal) => {
                    const cfg = GOAL_CONFIGS[goal.goal_type];
                    const p = progress[goal.id] ?? { current: 0, target: goal.target_value, percentage: 0 };
                    const isBookGoal = goal.goal_type !== 'daily_pages';

                    if (isBookGoal) {
                      return (
                        <MonthlyGoalCard
                          key={goal.id}
                          goal={goal}
                          p={p}
                          cfg={cfg}
                          onEdit={() => handleEditClicked(goal)}
                          onDeactivate={() => handleDeactivate(goal.id)}
                        />
                      );
                    }

                    // ── Card simples para metas diárias ──
                    const done = p.percentage >= 100;
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={goal.id}
                        className={`relative bg-white dark:bg-dark-900 rounded-3xl border transition-all duration-300 overflow-hidden group ${done
                            ? 'border-green-400/50 dark:border-green-500/20 shadow-xl shadow-green-500/5'
                            : 'border-slate-200 dark:border-dark-800 hover:border-slate-300 dark:hover:border-dark-700 hover:shadow-2xl'
                          }`}
                      >
                        <div className={`h-1 w-full bg-gradient-to-r ${cfg.gradient}`} style={{ opacity: done ? 1 : 0.6 }} />
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${cfg.color}18` }}>
                                <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 dark:text-cream-200/30 uppercase tracking-widest mb-0.5">
                                  {cfg.emoji} {cfg.period}
                                </p>
                                <h3 className="font-black text-slate-900 dark:text-cream-50 text-sm leading-tight">{cfg.label}</h3>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => handleEditClicked(goal)} className="p-2 text-slate-400 hover:text-dark-950 hover:bg-cream-100/80 dark:hover:text-dark-950 dark:hover:bg-cream-100 transition-all rounded-xl" aria-label="Editar meta">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeactivate(goal.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-500/10 transition-all rounded-xl" aria-label="Desativar meta">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="relative flex-shrink-0">
                              <ProgressRing percentage={p.percentage} color={done ? '#22c55e' : cfg.color} />
                              <div className="absolute inset-0 flex items-center justify-center">
                                {done ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                                ) : (
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{Math.round(p.percentage)}%</span>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline gap-1 mb-1">
                                <span className="text-4xl font-black tracking-tighter" style={{ color: done ? '#22c55e' : cfg.color }}>{p.current}</span>
                                <span className="text-slate-400 dark:text-cream-200/20 text-xs font-bold uppercase tracking-widest mb-1.5 ml-1">/ {p.target} {cfg.unit}</span>
                              </div>
                              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${done ? 'from-green-400 to-emerald-500' : cfg.gradient}`} style={{ width: `${p.percentage}%` }} />
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {done ? 'Meta concluída! 🎉' : `Faltam ${p.target - p.current} ${cfg.unit}`}
                              </p>
                            </div>
                          </div>
                          {done && (
                            <div className="mt-6 flex items-center gap-3 bg-green-500/5 dark:bg-green-500/10 border border-green-500/20 rounded-2xl px-4 py-3">
                              <Trophy className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Meta conquistada!</span>
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

      {/* ── Modal: Nova / Editar Meta ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div 
            className="bg-white dark:bg-dark-900 rounded-[2.5rem] w-full max-w-lg border border-slate-200 dark:border-dark-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="goal-modal-title"
          >
            {/* Header Gradiente */}
            <div className={`bg-gradient-to-r ${selectedConfig.gradient} p-6 flex-shrink-0 relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/20">
                    <selectedConfig.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 id="goal-modal-title" className="text-xl font-black text-white leading-tight">
                      {editingGoalId ? 'Editar Meta' : 'Nova Meta'}
                    </h2>
                    <p className="text-white/80 text-xs font-medium uppercase tracking-wider">{selectedConfig.label}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setShowModal(false); setEditingGoalId(null); setFormData({ goal_type: 'daily_pages', target_value: '' }); }}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="overflow-y-auto flex-1 p-8 space-y-10 custom-scrollbar bg-white dark:bg-dark-950">
              {/* Presets */}
              <section aria-labelledby="presets-title">
                <p id="presets-title" className="text-[10px] font-black text-slate-400 dark:text-cream-200/20 uppercase tracking-[0.3em] mb-6">
                  ⚡ Sugestões Rápidas
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`text-[11px] px-5 py-2.5 rounded-2xl font-black uppercase tracking-wider transition-all border focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-950 ${formData.goal_type === p.type && formData.target_value === String(p.value)
                          ? 'bg-cream-100 text-dark-950 border-cream-100 shadow-xl shadow-black/40 scale-105'
                          : 'bg-slate-50 dark:bg-dark-900 text-slate-500 dark:text-cream-200/30 hover:bg-dark-800 dark:hover:bg-dark-800 hover:text-cream-100 dark:hover:text-cream-100 border-slate-100 dark:border-dark-800'
                        }`}
                      aria-pressed={formData.goal_type === p.type && formData.target_value === String(p.value)}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Tipo */}
              <section aria-labelledby="type-title">
                <p id="type-title" className="text-[10px] font-black text-slate-400 dark:text-cream-200/20 uppercase tracking-[0.3em] mb-6">
                  🎯 Personalizar Objetivo
                </p>
                <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby="type-title">
                  {(Object.entries(GOAL_CONFIGS) as [GoalType, typeof GOAL_CONFIGS[GoalType]][]).map(
                    ([type, cfg]) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData((f) => ({ ...f, goal_type: type }))}
                        role="radio"
                        aria-checked={formData.goal_type === type}
                        className={`flex flex-col gap-3 p-4 rounded-3xl border-2 text-left transition-all group relative overflow-hidden focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-950 ${formData.goal_type === type
                            ? 'border-cream-100 bg-cream-100/5'
                            : 'border-slate-100 dark:border-dark-800 hover:border-dark-700 bg-slate-50/50 dark:bg-black/20'
                          }`}
                      >
                        <div className="p-2 rounded-xl w-fit transition-transform group-hover:scale-110" style={{ backgroundColor: `${cfg.color}15` }}>
                          <cfg.icon className="w-5 h-5" style={{ color: cfg.color }} />
                        </div>
                        <div>
                          <p className={`text-sm font-black transition-colors ${formData.goal_type === type ? 'text-cream-100' : 'text-slate-900 dark:text-cream-200/50'}`}>
                            {cfg.label}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-cream-200/20 mt-1">{cfg.period}</p>
                        </div>
                        {/* Info extra para metas de livros */}
                        {type === 'monthly_books' && (
                          <p className="text-[9px] text-slate-400 dark:text-cream-200/20 leading-relaxed">
                            Conta livros finalizados no mês
                          </p>
                        )}
                      </button>
                    )
                  )}
                </div>
              </section>

              {/* Valor */}
              <section aria-labelledby="value-title">
                <label id="value-title" htmlFor="goal_target_value" className="text-[10px] font-black text-slate-400 dark:text-cream-200/20 uppercase tracking-[0.3em] mb-6 block">
                  🔢 Valor da Meta
                </label>
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-cream-200/20 group-focus-within:text-cream-100 transition-colors">
                    <Target className="w-5 h-5 shadow-sm" />
                  </div>
                  <input
                    id="goal_target_value"
                    type="number"
                    value={formData.target_value}
                    onChange={(e) => setFormData((f) => ({ ...f, target_value: e.target.value }))}
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-black/40 border-2 border-slate-100 dark:border-dark-800 rounded-[2rem] focus:outline-none focus:border-cream-100 focus:ring-4 focus:ring-cream-100/5 dark:text-cream-100 text-2xl font-black transition-all shadow-inner placeholder-dark-800"
                    required
                    min="1"
                    placeholder={`Ex: ${selectedConfig.unit === 'páginas' ? '30' : '2'}`}
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 dark:text-cream-200/20 uppercase tracking-[0.2em]">
                    {selectedConfig.unit}
                  </div>
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 dark:bg-dark-900 backdrop-blur-md border-t border-slate-200 dark:border-dark-800 flex gap-4 flex-shrink-0">
              <button
                type="button"
                onClick={() => { setShowModal(false); setEditingGoalId(null); setFormData({ goal_type: 'daily_pages', target_value: '' }); }}
                className="flex-1 px-6 py-4 bg-white dark:bg-dark-800 text-slate-600 dark:text-cream-200/50 border border-slate-200 dark:border-dark-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-dark-700 transition-all font-bold text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit as any}
                className={`flex-[1.5] px-6 py-4 bg-gradient-to-r ${selectedConfig.gradient} text-dark-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all hover:opacity-90 active:scale-95 shadow-black/40`}
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
