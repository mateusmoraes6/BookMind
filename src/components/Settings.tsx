import { useEffect, useState } from 'react';
import { Save, Moon, Sun, Bell, Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UserPreferences {
    daily_reading_reminder: boolean;
    reminder_time: string;
    theme: 'light' | 'dark';
    books_per_page: number;
}

export default function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({
        daily_reading_reminder: true,
        reminder_time: '20:00',
        theme: 'dark', // Mudado de 'light' para 'dark' como padrão
        books_per_page: 12,
    });

    useEffect(() => {
        if (user) {
            loadPreferences();
        }
    }, [user]);

    const loadPreferences = async () => {
        if (!user) return;

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase.from('user_preferences') as any)
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setPreferences({
                    daily_reading_reminder: data.daily_reading_reminder ?? true,
                    reminder_time: data.reminder_time ? data.reminder_time.slice(0, 5) : '20:00',
                    theme: (data.theme as 'light' | 'dark') ?? 'dark', // Mudado de 'light' para 'dark'
                    books_per_page: data.books_per_page ?? 12,
                });
                applyTheme((data.theme as 'light' | 'dark') ?? 'dark'); // Mudado de 'light' para 'dark'
            } else {
                // Não criar preferências padrão automaticamente
                // Deixa o tema dark padrão do App.tsx
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (theme: 'light' | 'dark') => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase.from('user_preferences') as any)
                .upsert({
                    user_id: user.id,
                    daily_reading_reminder: preferences.daily_reading_reminder,
                    reminder_time: preferences.reminder_time,
                    theme: preferences.theme,
                    books_per_page: preferences.books_per_page,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            applyTheme(preferences.theme);
            alert('Configurações salvas com sucesso!');
        } catch (error) {
            console.error('Error saving preferences:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Configurações</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Personalize sua experiência no BookMind</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-8">
                {/* Appearance */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <Sun className="w-5 h-5" />
                        <h2>Aparência</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => {
                                setPreferences(p => ({ ...p, theme: 'light' }));
                                applyTheme('light');
                            }}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${preferences.theme === 'light'
                                    ? 'border-slate-900 bg-slate-50 dark:border-slate-400'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                }`}
                        >
                            <Sun className="w-6 h-6 text-amber-500" />
                            <span className="font-medium text-slate-900 dark:text-slate-200">Claro</span>
                        </button>
                        <button
                            onClick={() => {
                                setPreferences(p => ({ ...p, theme: 'dark' }));
                                applyTheme('dark');
                            }}
                            className={`p-4 rounded-lg border-2 flex flex-col items-center gap-2 transition ${preferences.theme === 'dark'
                                    ? 'border-slate-900 bg-slate-900 text-white dark:border-indigo-500'
                                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                                }`}
                        >
                            <Moon className="w-6 h-6 text-indigo-400" />
                            <span className="font-medium text-slate-900 dark:text-slate-200">Escuro</span>
                        </button>
                    </div>
                </section>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Notifications */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <Bell className="w-5 h-5" />
                        <h2>Notificações</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-slate-700 dark:text-slate-300">Lembrete diário de leitura</label>
                            <button
                                onClick={() => setPreferences(p => ({ ...p, daily_reading_reminder: !p.daily_reading_reminder }))}
                                className={`w-12 h-6 rounded-full transition-colors relative ${preferences.daily_reading_reminder ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${preferences.daily_reading_reminder ? 'translate-x-6' : 'translate-x-0'
                                    }`} />
                            </button>
                        </div>

                        {preferences.daily_reading_reminder && (
                            <div className="flex items-center justify-between">
                                <label className="text-slate-700 dark:text-slate-300">Horário do lembrete</label>
                                <input
                                    type="time"
                                    value={preferences.reminder_time}
                                    onChange={(e) => setPreferences(p => ({ ...p, reminder_time: e.target.value }))}
                                    className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                </section>

                <hr className="border-slate-200 dark:border-slate-700" />

                {/* Interface */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                        <Layout className="w-5 h-5" />
                        <h2>Interface</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <label className="text-slate-700 dark:text-slate-300">Livros por página</label>
                        <select
                            value={preferences.books_per_page}
                            onChange={(e) => setPreferences(p => ({ ...p, books_per_page: Number(e.target.value) }))}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 dark:text-white"
                        >
                            <option value={8}>8 livros</option>
                            <option value={12}>12 livros</option>
                            <option value={24}>24 livros</option>
                            <option value={48}>48 livros</option>
                        </select>
                    </div>
                </section>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
