import { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, BookOpen, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [heatmapData, setHeatmapData] = useState<any>({});

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, currentMonth]);

  const loadSessions = async () => {
    if (!user) return;

    const startOfYear = new Date(currentMonth.getFullYear(), 0, 1).toISOString().split('T')[0];
    const endOfYear = new Date(currentMonth.getFullYear(), 11, 31).toISOString().split('T')[0];

    const { data } = await supabase
      .from('reading_sessions')
      .select('*, books(title)')
      .eq('user_id', user.id)
      .gte('session_date', startOfYear)
      .lte('session_date', endOfYear)
      .order('session_date', { ascending: false });

    if (data) {
      setSessions(data);

      const heatmap: any = {};
      data.forEach((session) => {
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
    if (pages === 0) return 'bg-slate-100';
    if (pages < 10) return 'bg-green-200';
    if (pages < 25) return 'bg-green-300';
    if (pages < 50) return 'bg-green-400';
    return 'bg-green-500';
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
    const intensity = dayData ? getIntensity(dayData.pages) : 'bg-slate-100';

    days.push(
      <div
        key={day}
        className={`aspect-square rounded-lg ${intensity} flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-slate-900 transition`}
        title={dayData ? `${dayData.pages} páginas lidas` : 'Sem leituras'}
      >
        <span className="text-sm font-medium text-slate-700">{day}</span>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Calendário Literário</h1>
        <p className="text-slate-600 mt-2">Acompanhe sua consistência de leitura ao longo do tempo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <CalendarIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Sessões este Mês</p>
              <p className="text-2xl font-bold text-slate-900">{thisMonthSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Páginas este Mês</p>
              <p className="text-2xl font-bold text-slate-900">{totalPages}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Média por Sessão</p>
              <p className="text-2xl font-bold text-slate-900">{avgPages}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 capitalize">{monthName}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              Hoje
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-600">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">{days}</div>

        <div className="flex items-center gap-4 mt-6 text-sm">
          <span className="text-slate-600">Menos</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-slate-100 rounded" />
            <div className="w-4 h-4 bg-green-200 rounded" />
            <div className="w-4 h-4 bg-green-300 rounded" />
            <div className="w-4 h-4 bg-green-400 rounded" />
            <div className="w-4 h-4 bg-green-500 rounded" />
          </div>
          <span className="text-slate-600">Mais</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">Sessões Recentes</h2>
        </div>
        <div className="p-6">
          {thisMonthSessions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nenhuma sessão registrada este mês</p>
            </div>
          ) : (
            <div className="space-y-3">
              {thisMonthSessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{session.books.title}</p>
                    <p className="text-sm text-slate-600 mt-1">
                      {session.pages_read} páginas • {session.duration_minutes} minutos
                    </p>
                  </div>
                  <div className="text-sm text-slate-600">
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
