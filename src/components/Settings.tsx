import { useEffect, useState } from 'react';
import { Save, Moon, Sun, Bell, Layout, Download, Smartphone } from 'lucide-react';
import ConfirmDialog from './ConfirmDialog';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getLocalISOString } from '../lib/dateUtils';
import { PageHeader } from './ui/PageHeader';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';

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
    const [notification, setNotification] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'info' | 'warning';
    } | null>(null);
    const [showNotification, setShowNotification] = useState(false);
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
            setNotification({
                title: 'Como Instalar',
                message: 'Para instalar o BookMind:\n\nChrome/Edge: Clique nos 3 pontos ⋮ e escolha "Instalar BookMind" ou "Instalar Aplicativo".\n\nSafari (iOS): Toque no ícone de compartilhar (quadrado com seta) e escolha "Adicionar à Tela de Início".',
                type: 'info',
            });
            setShowNotification(true);
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
            setNotification({
                title: 'Sucesso',
                message: 'Configurações salvas com sucesso!',
                type: 'info',
            });
            setShowNotification(true);
        } catch (error) {
            console.error('Error saving preferences:', error);
            setNotification({
                title: 'Erro',
                message: 'Erro ao salvar configurações.',
                type: 'danger',
            });
            setShowNotification(true);
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
            <PageHeader
                title="Configurações"
                description="Personalize sua experiência no BookMind"
            />

            <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 p-8 space-y-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cream-100/5 rounded-full -mr-32 -mt-32 blur-[100px]" />

                {/* Appearance */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 text-lg font-black text-slate-900 dark:text-cream-50 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-2xl flex items-center justify-center border border-cream-100/10 shadow-sm">
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
                            className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${preferences.theme === 'light'
                                ? 'border-cream-100 bg-cream-100 text-dark-950 shadow-xl shadow-cream-100/20'
                                : 'border-slate-100 dark:border-dark-800 hover:border-slate-200 dark:hover:border-dark-700 bg-slate-50 dark:bg-dark-950/50'
                                }`}
                        >
                            <Sun className={`w-7 h-7 ${preferences.theme === 'light' ? 'text-dark-950' : 'text-amber-500'}`} />
                            <span className="font-black text-xs uppercase tracking-widest">Claro</span>
                        </button>
                        <button
                            onClick={() => {
                                setPreferences(p => ({ ...p, theme: 'dark' }));
                                applyTheme('dark');
                            }}
                            role="radio"
                            aria-checked={preferences.theme === 'dark'}
                            className={`p-6 rounded-[2rem] border-2 flex flex-col items-center gap-3 transition-all duration-300 ${preferences.theme === 'dark'
                                ? 'border-dark-950 bg-dark-950 text-cream-100 shadow-xl shadow-black/40'
                                : 'border-slate-100 dark:border-dark-800 hover:border-slate-200 dark:hover:border-dark-700 bg-slate-50 dark:bg-dark-950/50'
                                }`}
                        >
                            <Moon className={`w-7 h-7 ${preferences.theme === 'dark' ? 'text-cream-100' : 'text-indigo-400'}`} />
                            <span className="font-black text-xs uppercase tracking-widest">Escuro</span>
                        </button>
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-dark-800" />

                {/* Notifications */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 text-lg font-black text-slate-900 dark:text-cream-50 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-2xl flex items-center justify-center border border-cream-100/10 shadow-sm">
                            <Bell className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Notificações</h2>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 px-6 bg-slate-50/50 dark:bg-dark-950/50 rounded-[1.5rem] border border-transparent dark:border-dark-800 transition-all hover:bg-slate-50 dark:hover:bg-dark-950">
                            <div>
                                <label htmlFor="reminder-toggle" className="text-sm font-black text-slate-900 dark:text-cream-100 tracking-tight">Lembrete diário de leitura</label>
                                <p className="text-[10px] text-slate-500 dark:text-cream-200/20 uppercase font-black tracking-widest mt-1">Sempre no mesmo horário</p>
                            </div>
                            <button
                                id="reminder-toggle"
                                onClick={() => setPreferences(p => ({ ...p, daily_reading_reminder: !p.daily_reading_reminder }))}
                                aria-pressed={preferences.daily_reading_reminder}
                                className={`w-14 h-7 rounded-full transition-all relative ${preferences.daily_reading_reminder ? 'bg-cream-100' : 'bg-slate-200 dark:bg-dark-800'
                                    }`}
                            >
                                <div className={`absolute top-1 left-1 w-5 h-5 rounded-full transition-transform duration-500 shadow-md ${preferences.daily_reading_reminder ? 'translate-x-7 bg-dark-950' : 'translate-x-0 bg-white'
                                    }`} />
                            </button>
                        </div>

                        {preferences.daily_reading_reminder && (
                            <Input
                                id="reminder_time"
                                type="time"
                                label="Horário do lembrete"
                                value={preferences.reminder_time}
                                onChange={(e) => setPreferences(p => ({ ...p, reminder_time: e.target.value }))}
                                className="max-w-[200px]"
                            />
                        )}
                    </div>
                </section>

                <hr className="border-slate-100 dark:border-dark-800" />

                {/* Interface */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 text-lg font-black text-slate-900 dark:text-cream-50 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-2xl flex items-center justify-center border border-cream-100/10 shadow-sm">
                            <Layout className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Interface</h2>
                    </div>

                    <Select
                        id="books_per_page"
                        label="Livros por página"
                        value={preferences.books_per_page}
                        onChange={(e) => setPreferences(p => ({ ...p, books_per_page: Number(e.target.value) }))}
                        options={[
                            { label: '8 livros', value: 8 },
                            { label: '12 livros', value: 12 },
                            { label: '24 livros', value: 24 },
                            { label: '48 livros', value: 48 },
                        ]}
                    />
                </section>

                <hr className="border-slate-100 dark:border-dark-800" />

                {/* PWA Section */}
                <section className="space-y-6 relative z-10">
                    <div className="flex items-center gap-4 text-lg font-black text-slate-900 dark:text-cream-50 tracking-tight">
                        <div className="w-10 h-10 bg-cream-100/10 rounded-2xl flex items-center justify-center border border-cream-100/10 shadow-sm">
                            <Smartphone className="w-5 h-5 text-cream-100" />
                        </div>
                        <h2>Aplicativo</h2>
                    </div>

                    <div className="bg-slate-50 dark:bg-dark-950 p-8 rounded-[2rem] border border-transparent dark:border-dark-800 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-cream-100/10" />
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                            <div className="flex-1">
                                <h3 className="font-black text-slate-900 dark:text-cream-50 mb-1 tracking-tight">Progessive Web App</h3>
                                <p className="text-sm font-medium text-slate-500 dark:text-cream-200/40 leading-relaxed">
                                    {isInstalled
                                        ? 'O BookMind já está instalado em seu dispositivo como um aplicativo nativo.'
                                        : 'Acesse o BookMind offline e com desempenho otimizado instalando-o como aplicativo.'}
                                </p>
                            </div>

                            {!isInstalled && (
                                <Button
                                    onClick={handleInstallClick}
                                    className="px-8 py-4 h-auto rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20"
                                >
                                    <Download className="w-5 h-5 mr-3" />
                                    Instalar Agora
                                </Button>
                            )}

                            {isInstalled && (
                                <div className="px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                                    Já Instalado
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <div className="pt-6">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        isLoading={saving}
                        className="w-full py-5 h-auto rounded-2xl shadow-2xl shadow-black/40 font-black text-xs uppercase tracking-[0.25em]"
                    >
                        {!saving && <Save className="w-5 h-5 mb-0.5 mr-4" />}
                        {saving ? 'Salvando...' : 'Salvar Preferências'}
                    </Button>
                </div>
            </div>

            {notification && (
                <ConfirmDialog
                    isOpen={showNotification}
                    title={notification.title}
                    message={notification.message}
                    onConfirm={() => setShowNotification(false)}
                    onCancel={() => setShowNotification(false)}
                    confirmLabel="Entendido"
                    showCancel={false}
                    type={notification.type}
                />
            )}
        </div>
    );
}
