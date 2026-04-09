import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4 sm:px-0">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-black/10 border transform transition-all duration-200 animate-in slide-in-from-bottom-2 fade-in",
                            t.type === 'success' ? 'bg-success dark:bg-success-dark text-white border-success/20' : '',
                            t.type === 'error' ? 'bg-danger dark:bg-danger-dark text-white border-danger/20' : '',
                            t.type === 'info' ? 'bg-slate-900 border-slate-800 text-white dark:bg-dark-800' : ''
                        )}
                        role="alert"
                    >
                        <div className="flex items-center gap-3">
                            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
                            {t.type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0" />}
                            {t.type === 'info' && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
                            <p className="text-sm font-bold tracking-wide">{t.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
                            aria-label="Fechar"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
