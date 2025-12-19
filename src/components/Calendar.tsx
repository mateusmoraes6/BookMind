import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [heatmapData, setHeatmapData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, currentMonth]);

  const loadSessions = async () => {
    if (!user) return;

    setLoading(true);

    const startOfYear = new Date(currentMonth.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endOfYear = new Date(currentMonth.getFullYear(), 11, 31).toISOString().split('T')[0];

    const { data } = await (supabase
      .from('reading_sessions') as any)
      .select('*, books(title)')
      .eq('user_id', user.id)
      .gte('session_date', startOfYear)
      .lte('session_date', endOfYear)
      .order('session_date', { ascending: false });

    if (data) {
      setSessions(data);

      const heatmap: any = {};
      data.forEach((session: any) => {
        if (!heatmap[session.session_date]) {
          heatmap[session.session_date] = {
            count: 0,
            pages: 0,
            sessions: [],
          };
        }
        heatmap[session.session_date].count += 1;
        heatmap[session.session_date].pages += session.pages_read;
        heatmap[session.session_date].sessions.push(session);
      });
      setHeatmapData(heatmap);
    }

    setLoading(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const getIntensity = (pages: number) => {
    if (pages === 0) return 'bg-slate-100 dark:bg-slate-700/50';
    if (pages < 10) return 'bg-green-200 dark:bg-green-900/40';
    if (pages < 25) return 'bg-green-300 dark:bg-green-800/60';
    if (pages < 50) return 'bg-green-400 dark:bg-green-700/80';
    return 'bg-green-500 dark:bg-green-600';
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
  const days = [];

  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="aspect-square" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toISOString().split('T')[0];
    const dayData = heatmapData[dateStr];
    const intensity = dayData ? getIntensity(dayData.pages) : 'bg-slate-100 dark:bg-slate-700/50';

    days.push(
      <div
        key={day}
        className={`aspect-square rounded-lg ${intensity} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-slate-900 dark:hover:ring-indigo-500 transition`}
        title={dayData ? `${dayData.pages} páginas lidas` : 'Sem leituras'}
      >
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{day}</span>
      </div>
    );
  }

  const changeMonth = (delta: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const monthName = currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const thisMonthSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.session_date);
    return (
      sessionDate.getMonth() === currentMonth.getMonth() &&
      sessionDate.getFullYear() === currentMonth.getFullYear()
    );
  });

  const totalPages = thisMonthSessions.reduce((sum, s) => sum + (s.pages_read || 0), 0);
  const avgPages = thisMonthSessions.length > 0 ? Math.round(totalPages / thisMonthSessions.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Calendário Literário</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Acompanhe sua consistência de leitura ao longo do tempo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Sessões este Mês</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{thisMonthSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Páginas este Mês</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalPages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Média por Sessão</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgPages}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize">{monthName}</h2>
          <div className="flex gap-2 justify-center sm:justify-end">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition text-slate-600 dark:text-slate-300"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition text-slate-600 dark:text-slate-300"
            >
              Hoje
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition text-slate-600 dark:text-slate-300"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-600 dark:text-slate-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">{days}</div>

        <div className="flex items-center gap-4 mt-6 text-sm">
          <span className="text-slate-600 dark:text-slate-400">Menos</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-slate-100 dark:bg-slate-700/50 rounded" />
            <div className="w-4 h-4 bg-green-200 dark:bg-green-900/40 rounded" />
            <div className="w-4 h-4 bg-green-300 dark:bg-green-800/60 rounded" />
            <div className="w-4 h-4 bg-green-400 dark:bg-green-700/80 rounded" />
            <div className="w-4 h-4 bg-green-500 dark:bg-green-600 rounded" />
          </div>
          <span className="text-slate-600 dark:text-slate-400">Mais</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sessões Recentes</h2>
        </div>
        <div className="p-6">
          {thisMonthSessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">Nenhuma sessão registrada este mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              {thisMonthSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 dark:text-white">{session.books.title}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {session.pages_read} páginas • {session.duration_minutes} minutos
                    </p>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">
                    {new Date(session.session_date).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
