import { useEffect, useState } from 'react';
import { Save, Moon, Sun, Bell, Layout, Download, Smartphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalISOString } from '../lib/dateUtils';

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
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [preferences, setPreferences] = useState<UserPreferences>({
        daily_reading_reminder: true,
        reminder_time: '20:00',
        theme: 'dark',
        books_per_page: 12,
    });

    useEffect(() => {
        if (user) {
            loadPreferences();
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, [user]);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        } else {
            alert('Para instalar o BookMind:\n\nChrome/Edge: Clique nos 3 pontos ⋮ e escolha "Instalar BookMind" ou "Instalar Aplicativo".\n\nSafari (iOS): Toque no ícone de compartilhar (quadrado com seta) e escolha "Adicionar à Tela de Início".');
        }
    };

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
                    theme: (data.theme as 'light' | 'dark') ?? 'dark',
                    books_per_page: data.books_per_page ?? 12,
                });
                applyTheme((data.theme as 'light' | 'dark') ?? 'dark');
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
                    updated_at: getLocalISOString(),
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 dark:border-cream-100"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-cream-100">Configurações</h1>
                <p className="text-slate-600 dark:text-slate-400 mt-2">Personalize sua experiência no BookMind</p>
            </div>

            <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 p-8 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cream-100/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

                {/* Appearance */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-cream-100 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-xl flex items-center justify-center">
                            <Sun className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Aparência</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4" role="radiogroup" aria-labelledby="appearance-title">
                        <button
                            id="appearance-title"
                            onClick={() => {
                                setPreferences(p => ({ ...p, theme: 'light' }));
                                applyTheme('light');
                            }}
                            role="radio"
                            aria-checked={preferences.theme === 'light'}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${preferences.theme === 'light'
                                ? 'border-cream-100 bg-cream-100 dark:border-dark-800'
                                : 'border-slate-200 hover:border-slate-300 dark:border-dark-800 dark:hover:border-dark-700'
                                }`}
                        >
                            <Sun className={`w-6 h-6 ${preferences.theme === 'light' ? 'text-dark-950' : 'text-amber-500 dark:text-cream-200'}`} />
                            <span className={`font-medium ${preferences.theme === 'light' ? 'text-dark-950' : 'text-slate-900 dark:text-cream-100'}`}>Claro</span>
                        </button>
                        <button
                            onClick={() => {
                                setPreferences(p => ({ ...p, theme: 'dark' }));
                                applyTheme('dark');
                            }}
                            role="radio"
                            aria-checked={preferences.theme === 'dark'}
                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition ${preferences.theme === 'dark'
                                ? 'border-dark-950 bg-dark-950 text-white dark:border-cream-100'
                                : 'border-slate-200 hover:border-slate-300 dark:border-dark-800 dark:hover:border-dark-700'
                                }`}
                        >
                            <Moon className={`w-6 h-6 ${preferences.theme === 'dark' ? 'text-cream-100' : 'text-indigo-400 dark:text-cream-200'}`} />
                            <span className={`font-medium ${preferences.theme === 'dark' ? 'text-cream-100' : 'text-slate-900 dark:text-cream-100'}`}>Escuro</span>
                        </button>
                    </div>
                </section>

                <hr className="border-slate-200 dark:border-dark-800" />

                {/* Notifications */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-cream-100 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Notificações</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <label htmlFor="reminder-toggle" className="text-sm font-bold text-slate-700 dark:text-cream-200/60">Lembrete diário de leitura</label>
                            <button
                                id="reminder-toggle"
                                onClick={() => setPreferences(p => ({ ...p, daily_reading_reminder: !p.daily_reading_reminder }))}
                                aria-pressed={preferences.daily_reading_reminder}
                                className={`w-14 h-7 rounded-full transition-all relative ${preferences.daily_reading_reminder ? 'bg-cream-100' : 'bg-slate-200 dark:bg-dark-800'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${preferences.daily_reading_reminder ? 'translate-x-7 bg-dark-950' : 'translate-x-0 bg-white'
                                    }`} />
                            </button>
                        </div>

                        {preferences.daily_reading_reminder && (
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-dark-950 p-4 rounded-2xl border border-transparent dark:border-dark-800">
                                <label htmlFor="reminder_time" className="text-sm font-bold text-slate-700 dark:text-cream-200/60">Horário do lembrete</label>
                                <input
                                    id="reminder_time"
                                    type="time"
                                    value={preferences.reminder_time}
                                    onChange={(e) => setPreferences(p => ({ ...p, reminder_time: e.target.value }))}
                                    className="px-4 py-2 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black transition-all"
                                />
                            </div>
                        )}
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-dark-800" />

                {/* Interface */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-cream-100 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-xl flex items-center justify-center">
                            <Layout className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Interface</h2>
                    </div>

                    <div className="flex items-center justify-between">
                        <label htmlFor="books_per_page" className="text-sm font-bold text-slate-700 dark:text-cream-200/60">Livros por página</label>
                        <select
                            id="books_per_page"
                            value={preferences.books_per_page}
                            onChange={(e) => setPreferences(p => ({ ...p, books_per_page: Number(e.target.value) }))}
                            className="px-4 py-2 bg-slate-50 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-cream-100 dark:text-cream-50 font-black transition-all cursor-pointer"
                        >
                            <option value={8} className="bg-dark-900">8 livros</option>
                            <option value={12} className="bg-dark-900">12 livros</option>
                            <option value={24} className="bg-dark-900">24 livros</option>
                            <option value={48} className="bg-dark-900">48 livros</option>
                        </select>
                    </div>
                </section>

                <hr className="border-slate-200 dark:border-dark-800" />

                {/* PWA Section */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-3 text-lg font-black text-slate-900 dark:text-cream-100 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-xl flex items-center justify-center">
                            <Smartphone className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Aplicativo</h2>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-950 p-6 rounded-3xl border border-transparent dark:border-dark-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex-1">
                                <h3 className="font-bold text-slate-900 dark:text-cream-50 mb-1">Versão Web App (PWA)</h3>
                                <p className="text-sm text-slate-500 dark:text-cream-200/40">
                                    {isInstalled
                                        ? 'O BookMind já está instalado em seu dispositivo como um aplicativo nativo.'
                                        : 'Instale o BookMind no seu celular ou desktop para ter acesso rápido e uma experiência mais fluida.'}
                                </p>
                            </div>

                            {!isInstalled && (
                                <button
                                    onClick={handleInstallClick}
                                    className="flex items-center justify-center gap-2 px-6 py-3 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-black/20"
                                >
                                    <Download className="w-4 h-4" />
                                    Instalar Agora
                                </button>
                            )}

                            {isInstalled && (
                                <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                    Já Instalado
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="pt-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition-all shadow-2xl shadow-black/30 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 disabled:opacity-50"
                    >
                        <Save className="w-5 h-5 mb-0.5" />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
