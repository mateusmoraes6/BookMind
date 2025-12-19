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
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-slide-up">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-2xl p-4 text-white">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                        <Download className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">
                            Instalar BookMind
                        </h3>
                        <p className="text-sm text-white/90 mb-3">
                            Instale o app no seu dispositivo para acesso rápido e experiência completa!
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="flex-1 bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                            >
                                Instalar
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="px-4 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors"
                            >
                                Agora não
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
                        aria-label="Fechar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
