import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, TrendingUp, Target, Award, BookMarked,
  Flame, Trophy, BarChart2, ChevronLeft, ChevronRight,
  PauseCircle
} from 'lucide-react';
import { getLocalDateISO } from '../lib/dateUtils';
import { useDashboardData } from '../hooks/useDashboardData';
import BookDetailModal from './BookDetailModal';
import BookModal from './BookModal';
import { Book, BOOK_STATUS_METADATA, BookStatus } from '../types/book';
import { Skeleton, InlineError, EmptyState } from './feedback';
import { PageHeader } from './ui/PageHeader';

// Interfaces moved to sessionsService.ts

// Interfaces moved to sessionsService.ts

export default function Dashboard() {
  const {
    stats, currentBooks, recentBooks, allBooks,
    last7Days, activeGoals, loading, error, refresh
  } = useDashboardData();

  const [activeBookIndex, setActiveBookIndex] = useState(0);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  // Gradiente dinâmico extraído da capa do livro atual
  const [heroGradient, setHeroGradient] = useState<string>(
    'linear-gradient(135deg, #0a0a0a, #121212, #1a1a1a)'
  );
  const [gradientLoaded, setGradientLoaded] = useState(false);

  // Sync selectedBook when data changes
  useEffect(() => {
    if (selectedBook) {
      const updated = allBooks.find(b => b.id === selectedBook.id);
      if (updated) setSelectedBook(updated);
    }
  }, [allBooks]);

  // ── Extração de cor dominante da capa ──────────────────────────────────────
  useEffect(() => {
    const focused = currentBooks[activeBookIndex];
    if (!focused?.cover_url) {
      setHeroGradient('linear-gradient(135deg, #0a0a0a, #121212, #1a1a1a)');
      setGradientLoaded(false);
      return;
    }
    extractDominantColors(focused.cover_url)
      .then((colors) => {
        if (colors.length >= 2) {
          setHeroGradient(
            `linear-gradient(135deg, ${colors[0]}, ${colors[1]}${colors[2] ? `, ${colors[2]}` : ''
            })`
          );
          setGradientLoaded(true);
        } else {
          setHeroGradient('linear-gradient(135deg, #0a0a0a, #121212, #1a1a1a)');
        }
      })
      .catch(() => {
        setHeroGradient('linear-gradient(135deg, #0a0a0a, #121212, #1a1a1a)');
      });
  }, [activeBookIndex, currentBooks]);


  // ── Helpers de extração de cor ────────────────────────────────────────────
  const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    if (max === min) return [0, 0, l * 100];
    const d = max - min;
    const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    let h = 0;
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
    return [h * 360, s * 100, l * 100];
  };

  const extractDominantColors = (imageUrl: string): Promise<string[]> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      // Timeout de segurança
      const timer = setTimeout(() => resolve([]), 6000);

      img.onload = () => {
        clearTimeout(timer);
        try {
          const W = 80, H = 120;
          const canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve([]); return; }

          ctx.drawImage(img, 0, 0, W, H);
          const { data } = ctx.getImageData(0, 0, W, H);

          // Amostrar pixels (a cada 3)
          const pixels: [number, number, number][] = [];
          for (let i = 0; i < data.length; i += 4 * 3) {
            const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            // Ignorar pixels muito claros, muito escuros e transparentes
            if (a < 128) continue;
            const brightness = (r + g + b) / 3;
            if (brightness < 20 || brightness > 230) continue;
            pixels.push([r, g, b]);
          }

          if (pixels.length === 0) { resolve([]); return; }

          // Bucketing simples: agrupar cores similares
          const BUCKET = 28;
          const map = new Map<string, { sumR: number; sumG: number; sumB: number; count: number }>();
          for (const [r, g, b] of pixels) {
            const key = `${Math.floor(r / BUCKET)},${Math.floor(g / BUCKET)},${Math.floor(b / BUCKET)}`;
            const e = map.get(key);
            if (e) { e.sumR += r; e.sumG += g; e.sumB += b; e.count++; }
            else map.set(key, { sumR: r, sumG: g, sumB: b, count: 1 });
          }

          // Top buckets por frequência
          const dominated = [...map.values()]
            .sort((a, b) => b.count - a.count)
            .slice(0, 8)
            .map(({ sumR, sumG, sumB, count }) => [
              sumR / count,
              sumG / count,
              sumB / count,
            ] as [number, number, number]);

          // Converter para HSL escuro e saturado (tom da capa, escuro o suficiente para texto)
          const results = dominated.slice(0, 3).map(([r, g, b]) => {
            const [h, s] = rgbToHsl(r, g, b);
            // Fixar leveza baixa (20-22%) e manter saturação vibrante
            const newL = 19;
            const newS = Math.min(Math.max(s * 0.85, 38), 85);
            return `hsl(${Math.round(h)}, ${Math.round(newS)}%, ${Math.round(newL)}%)`;
          });

          resolve(results);
        } catch {
          // CORS ou outro erro: gradiente padrão
          resolve([]);
        }
      };

      img.onerror = () => { clearTimeout(timer); resolve([]); };
      // Adicionar cache-buster NÃO é necessário; o crossOrigin já lida com isso
      img.src = imageUrl;
    });
  };


  const getStatusLabel = (status: string) => {
    return BOOK_STATUS_METADATA[status as BookStatus]?.label || status;
  };

  const getStatusStyle = (status: string) => {
    const meta = BOOK_STATUS_METADATA[status as BookStatus];
    if (!meta) return 'bg-slate-500/20 text-slate-400';
    // Adapt target background classes for dashboard minor labels
    return `${meta.bgClass.replace('/80', '/20')} ${meta.textClass} border ${meta.borderClass}`;
  };

  const statCards = [
    {
      label: 'Total de Livros',
      value: stats.totalBooks,
      icon: BookOpen,
      gradient: 'from-blue-600 to-blue-400',
      glow: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Lendo agora',
      value: stats.booksInProgress,
      icon: BookMarked,
      gradient: 'from-amber-500 to-orange-400',
      glow: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Concluídos',
      value: stats.booksCompleted,
      icon: Award,
      gradient: 'from-green-600 to-emerald-400',
      glow: 'bg-green-500/10 border-green-500/20',
    },
    {
      label: 'Páginas Hoje',
      value: stats.pagesReadToday,
      icon: TrendingUp,
      gradient: 'from-violet-500 to-purple-600',
      glow: 'bg-violet-500/10 border-violet-500/20',
    },
    {
      label: 'Sequência',
      value: `${stats.currentStreak}d`,
      icon: Flame,
      gradient: 'from-red-500 to-orange-400',
      glow: 'bg-red-500/10 border-red-500/20',
    },
    {
      label: 'Pausados',
      value: stats.booksPaused,
      icon: PauseCircle,
      gradient: 'from-slate-600 to-slate-400',
      glow: 'bg-slate-500/10 border-slate-500/20',
    },
  ];

  const handleBookUpdated = () => {
    refresh(true); // Silent refresh
  };

  // ── Derived values & handlers (all before early return) ───────────────────
  const currentBook = currentBooks[activeBookIndex] ?? null;

  const goToPrev = useCallback(() => {
    setActiveBookIndex((i) => (i - 1 + currentBooks.length) % currentBooks.length);
  }, [currentBooks.length]);

  const goToNext = useCallback(() => {
    setActiveBookIndex((i) => (i + 1) % currentBooks.length);
  }, [currentBooks.length]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton variant="text" className="h-8 w-48 mb-2" />
          <Skeleton variant="text" className="h-4 w-64" />
        </div>

        {/* Hero Skeleton */}
        <div className="h-64 sm:h-80 w-full bg-slate-100 dark:bg-dark-900 rounded-[2.5rem] p-8 flex gap-8">
          <Skeleton className="w-40 h-full rounded-2xl hidden sm:block" />
          <div className="flex-1 space-y-4">
            <Skeleton variant="text" className="h-10 w-3/4" />
            <Skeleton variant="text" className="h-6 w-1/2" />
            <div className="pt-8">
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-32 bg-slate-50 dark:bg-dark-900 rounded-3xl border border-slate-100 dark:border-dark-800 p-4 space-y-3">
              <Skeleton className="w-10 h-10 rounded-xl" />
              <Skeleton variant="text" className="w-2/3" />
            </div>
          ))}
        </div>

        {/* Activity Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-50 dark:bg-dark-900 rounded-[2.5rem] p-8">
            <Skeleton variant="text" className="h-8 w-1/3 mb-8" />
            <div className="flex items-end gap-2 h-32">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <Skeleton key={i} className="flex-1 rounded-lg" style={{ height: `${20 + Math.random() * 60}%` }} />
              ))}
            </div>
          </div>
          <div className="h-80 bg-slate-50 dark:bg-dark-900 rounded-[2.5rem] p-8 space-y-6">
            <Skeleton variant="text" className="h-8 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <InlineError
          message={typeof error === 'string' ? error : error.message}
          onRetry={() => refresh()}
        />
      </div>
    );
  }

  const currentProgress =
    currentBook && currentBook.total_pages > 0
      ? Math.round((currentBook.current_page / currentBook.total_pages) * 100)
      : 0;

  const monthlyGoal = activeGoals.find((g) => g.goal_type === 'monthly_books');
  const dailyGoal = activeGoals.find((g) => g.goal_type === 'daily_pages');
  const yearlyGoal = activeGoals.find((g) => g.goal_type === 'yearly_books');

  const monthlyProgress = monthlyGoal
    ? Math.min(Math.round((stats.thisMonthBooks / monthlyGoal.target_value) * 100), 100)
    : 0;

  const dailyProgress = dailyGoal
    ? Math.min(Math.round((stats.pagesReadToday / dailyGoal.target_value) * 100), 100)
    : 0;

  const maxBarPages = Math.max(...last7Days.map((d) => d.pages), 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Visão geral das suas leituras"
      />

      {/* ── Hero: Lendo Agora ── */}
      {currentBooks.length > 0 && (
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl cursor-pointer group/hero"
          onClick={() => {
            setSelectedBook(currentBook);
            setShowDetailModal(true);
          }}
          style={{
            background: heroGradient,
            transition: gradientLoaded ? 'background 0.9s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
        >
          {/* Background decorations */}
          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute inset-0 bg-black/20" />

          <div className="relative p-6">
            {/* Header row: label + nav arrows (only when multiple books) */}
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/70 bg-white/10 px-2.5 py-1 rounded-full">
                📖 Lendo Agora
                {currentBooks.length > 1 && (
                  <span className="ml-1 bg-white/20 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    {activeBookIndex + 1}/{currentBooks.length}
                  </span>
                )}
              </span>

              {currentBooks.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToPrev();
                    }}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all"
                    aria-label="Livro anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      goToNext();
                    }}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/25 text-white transition-all"
                    aria-label="Próximo livro"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Book info row */}
            <div className="flex gap-5 items-start">
              {/* Cover */}
              {currentBook?.cover_url ? (
                <img
                  key={currentBook.id}
                  src={currentBook.cover_url}
                  alt={currentBook?.title}
                  className="w-20 h-28 sm:w-24 sm:h-36 object-cover rounded-xl shadow-2xl flex-shrink-0 border-2 border-white/20 transition-all duration-500"
                />
              ) : (
                <div className="w-20 h-28 sm:w-24 sm:h-36 bg-white/10 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                  <BookOpen className="w-8 h-8 text-white/50" />
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">
                  {currentBook?.title}
                </h2>
                <p className="text-white/60 text-sm mt-1 truncate">{currentBook?.author}</p>

                {currentBook?.genres && (
                  <span
                    className="inline-block text-xs px-2.5 py-0.5 rounded-full mt-2 font-medium border"
                    style={{
                      backgroundColor: `${currentBook.genres.color}25`,
                      color: currentBook.genres.color,
                      borderColor: `${currentBook.genres.color}50`,
                    }}
                  >
                    {currentBook.genres.name}
                  </span>
                )}

                {/* Progress bar */}
                {currentBook && currentBook.total_pages > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-white/70 mb-2">
                      <span className="font-medium">
                        Página {currentBook.current_page} de {currentBook.total_pages}
                      </span>
                      <span className="font-black text-white">{currentProgress}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-md">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(255,255,255,0.3)]"
                        style={{ width: `${currentProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/50 mt-2 font-medium">
                      {currentBook.total_pages - currentBook.current_page} páginas restantes
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Dot indicators — only when multiple books */}
            {currentBooks.length > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                {currentBooks.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBookIndex(i);
                    }}
                    className={`rounded-full transition-all duration-300 ${i === activeBookIndex
                      ? 'w-5 h-2 bg-white'
                      : 'w-2 h-2 bg-white/30 hover:bg-white/50'
                      }`}
                    aria-label={`Ir para livro ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className={`${card.glow} border rounded-2xl p-4 hover:scale-[1.03] hover:shadow-xl transition-all duration-300 dark:bg-dark-900/60 bg-white cursor-default group`}
            >
              <div
                className={`inline-flex p-2 rounded-xl bg-gradient-to-br ${card.gradient} mb-3 shadow-md`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-cream-50 leading-none">
                {card.value}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-cream-200/40 mt-2 font-bold uppercase tracking-wider leading-tight">
                {card.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Atividade + Metas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Widget de Atividade — últimos 7 dias */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          {/* Decorativo discreto */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-dark-800 to-dark-950 shadow-lg border border-dark-700">
                <BarChart2 className="w-4 h-4 text-cream-100" />
              </div>
              <div>
                <h2 className="font-black text-slate-900 dark:text-cream-50 text-sm tracking-tight">
                  Atividade de Leitura
                </h2>
                <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/30 tracking-widest mt-0.5">Últimos 7 dias</p>
              </div>
            </div>
            {stats.currentStreak > 0 && (
              <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-full">
                🔥 {stats.currentStreak} dias
              </div>
            )}
          </div>

          {/* Barras */}
          <div className="flex gap-2 items-end h-24">
            {last7Days.map((day, i) => {
              const barHeight =
                day.pages > 0
                  ? Math.max((day.pages / maxBarPages) * 80, 16)
                  : 6;
              const isToday = day.date === getLocalDateISO();
              const dayLabel = new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                weekday: 'short',
              });
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                  {day.pages > 0 && (
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 opacity-0 group-hover/bar:opacity-100 transition-opacity">
                      {day.pages}p
                    </span>
                  )}
                  <div
                    title={`${day.pages} páginas`}
                    className={`w-full rounded-lg transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(139,92,246,0.2)] ${day.pages > 0
                      ? isToday
                        ? 'bg-violet-500'
                        : 'bg-violet-500/30'
                      : 'bg-slate-100 dark:bg-dark-800'
                      }`}
                    style={{ height: `${barHeight}px` }}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-tighter mt-1 ${isToday
                      ? 'text-violet-400'
                      : 'text-slate-400 dark:text-dark-700'
                      }`}
                  >
                    {dayLabel.replace('.', '')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-800 flex justify-between items-center relative z-10">
            <span className="text-xs font-bold text-slate-500 dark:text-cream-200/30 uppercase tracking-widest">Resumo de Hoje</span>
            <span className="text-sm font-black text-slate-900 dark:text-cream-100">
              {stats.pagesReadToday > 0
                ? `${stats.pagesReadToday} páginas`
                : 'Pausa nas leituras'}
            </span>
          </div>
        </div>

        {/* Widget de Metas */}
        <div className="bg-white dark:bg-dark-900 rounded-2xl p-6 border border-slate-200 dark:border-dark-800 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-dark-800 to-dark-950 shadow-lg border border-dark-700">
              <Target className="w-4 h-4 text-cream-100" />
            </div>
            <div>
              <h2 className="font-black text-slate-900 dark:text-cream-50 text-sm tracking-tight">Metas Ativas</h2>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-cream-200/30 tracking-widest mt-0.5">Progresso atual</p>
            </div>
          </div>

          {!monthlyGoal && !dailyGoal && !yearlyGoal ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Trophy className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Nenhuma meta ativa
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Defina metas na seção Metas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {dailyGoal && (
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-900 dark:text-cream-50 uppercase tracking-wider">Meta Diária</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {stats.pagesReadToday} / {dailyGoal.target_value} pág.
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-400 to-purple-600 transition-all duration-1000"
                      style={{ width: `${dailyProgress}%` }}
                    />
                  </div>
                </div>
              )}
              {monthlyGoal && (
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-black text-slate-900 dark:text-cream-50 uppercase tracking-wider">Meta Mensal</span>
                    <span className="text-[10px] font-bold text-slate-500">
                      {stats.thisMonthBooks} / {monthlyGoal.target_value} livros
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                      style={{ width: `${monthlyProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totais rápidos */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-800 grid grid-cols-2 gap-4 relative z-10">
            <div className="text-center bg-slate-50 dark:bg-dark-800/40 rounded-2xl py-4 border border-transparent dark:border-dark-700 transition-colors hover:dark:border-dark-600">
              <p className="text-2xl font-black text-slate-900 dark:text-cream-100">
                {stats.totalPagesRead.toLocaleString('pt-BR')}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-cream-200/30 uppercase tracking-widest mt-1">Páginas totais</p>
            </div>
            <div className="text-center bg-slate-50 dark:bg-dark-800/40 rounded-2xl py-4 border border-transparent dark:border-dark-700 transition-colors hover:dark:border-dark-600">
              <p className="text-2xl font-black text-slate-900 dark:text-cream-100">
                {stats.booksCompleted}
              </p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-cream-200/30 uppercase tracking-widest mt-1">Concluídos</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Livros Recentes ── */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-slate-900 dark:text-cream-50 tracking-tight">
            {currentBook ? 'Outros Livros' : 'Livros Recentes'}
          </h2>
        </div>

        {recentBooks.length === 0 ? (
          <EmptyState
            title="Nenhum livro recente"
            description="Seus livros aparecerão aqui assim que você os adicionar à sua biblioteca."
            icon={BookOpen}
            action={{
              label: "Ir para Biblioteca",
              onClick: () => window.location.hash = '#/library' // Assuming hash routing or similar, but maybe just a button is enough
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBooks.map((book) => {
              const progress =
                book.total_pages > 0
                  ? Math.round((book.current_page / book.total_pages) * 100)
                  : 0;
              return (
                <button
                  key={book.id}
                  onClick={() => {
                    setSelectedBook(book);
                    setShowDetailModal(true);
                  }}
                  className="group block w-full text-left bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl p-4 hover:shadow-xl hover:border-dark-700 dark:hover:border-dark-600 transition-all duration-300"
                >
                  <div className="flex gap-3">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-14 h-20 object-cover rounded-lg shadow-sm flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 dark:text-cream-100 text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-cream-200/30 uppercase tracking-wide mt-1 truncate">
                        {book.author}
                      </p>

                      <div className="flex flex-wrap gap-1 mt-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getStatusStyle(book.status)}`}
                        >
                          {getStatusLabel(book.status)}
                        </span>
                        {book.genres && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-semibold border"
                            style={{
                              backgroundColor: `${book.genres.color}15`,
                              color: book.genres.color,
                              borderColor: `${book.genres.color}30`,
                            }}
                          >
                            {book.genres.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {book.status === 'in_progress' && (
                    <div className="mt-3">
                      <div className="h-1 bg-slate-100 dark:bg-dark-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-slate-900 dark:bg-cream-100 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {showDetailModal && selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedBook(null);
            refresh(true);
          }}
          onBookUpdated={handleBookUpdated}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
        />
      )}

      {showEditModal && selectedBook && (
        <BookModal
          book={selectedBook}
          onClose={() => {
            setShowEditModal(false);
            setSelectedBook(null);
            refresh(true);
          }}
        />
      )}
    </div>
  );
}
