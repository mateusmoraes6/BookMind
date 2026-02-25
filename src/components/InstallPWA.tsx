import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWA() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Previne o mini-infobar de aparecer no mobile
            e.preventDefault();
            // Guarda o evento para que possa ser disparado depois
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Mostra o banner de instalação
            setShowInstallBanner(true);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Verifica se já está instalado
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setShowInstallBanner(false);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Mostra o prompt de instalação
        deferredPrompt.prompt();

        // Aguarda a escolha do usuário
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Usuário aceitou instalar a PWA');
        } else {
            console.log('Usuário recusou instalar a PWA');
        }

        // Limpa o prompt
        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        // Salva no localStorage que o usuário dispensou
        localStorage.setItem('pwa-install-dismissed', 'true');
    };

    // Não mostra se o usuário já dispensou antes
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed === 'true') {
            setShowInstallBanner(false);
        }
    }, []);

    if (!showInstallBanner) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:max-w-md z-50 animate-slide-up">
            <div className="bg-white dark:bg-dark-900 rounded-[2rem] shadow-2xl p-6 border border-slate-200 dark:border-dark-800 backdrop-blur-md relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-2xl transition-all group-hover:bg-cream-100/10" />

                <div className="flex items-start gap-5 relative z-10">
                    <div className="w-12 h-12 bg-cream-100/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Download className="w-6 h-6 text-cream-100" />
                    </div>

                    <div className="flex-1">
                        <h3 className="text-lg font-black text-slate-900 dark:text-cream-50 tracking-tight leading-tight mb-2">
                            Instalar BookMind
                        </h3>
                        <p className="text-sm font-medium text-slate-500 dark:text-cream-200/40 mb-6 leading-relaxed">
                            Acesse seu universo literário instantaneamente instalando o app no seu dispositivo.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-cream-100 hover:bg-cream-50 text-dark-950 px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-black/20 transform active:scale-95"
                            >
                                Instalar Agora
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-6 py-3 bg-slate-50 dark:bg-dark-800 text-slate-600 dark:text-cream-200/40 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-dark-700 transition-all transform active:scale-95"
                            >
                                Agora não
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg transition-all text-slate-400 dark:text-cream-200/20"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
