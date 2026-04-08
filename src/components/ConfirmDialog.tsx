import { useEffect } from 'react';
import { AlertCircle, X, HelpCircle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'info' | 'warning';
  showCancel?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  type = 'danger',
  showCancel = true,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const typeConfig = {
    danger: {
      icon: AlertCircle,
      iconClass: 'bg-red-500/10 text-red-500',
      buttonClass: 'bg-red-500 hover:bg-red-600 text-white',
    },
    warning: {
      icon: HelpCircle,
      iconClass: 'bg-amber-500/10 text-amber-500',
      buttonClass: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    info: {
      icon: Info,
      iconClass: 'bg-cream-100/10 text-cream-100',
      buttonClass: 'bg-cream-100 hover:bg-cream-50 text-dark-950',
    },
  };

  const { icon: Icon, iconClass, buttonClass } = typeConfig[type];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
      <div
        className="bg-white dark:bg-dark-900 rounded-[2.5rem] max-w-sm w-full shadow-2xl border border-slate-200 dark:border-dark-800 relative overflow-hidden animate-in fade-in zoom-in duration-300"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        {/* Decorativo discreto */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-cream-100/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />

        <div className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-current shadow-lg ${iconClass}`}>
              <Icon className="w-8 h-8" />
            </div>
            
            <h2 id="confirm-title" className="text-2xl font-black text-slate-900 dark:text-cream-50 tracking-tight mb-2">
              {title}
            </h2>
            
            <p id="confirm-description" className="text-sm font-medium text-slate-500 dark:text-cream-200/40 leading-relaxed mb-8">
              {message}
            </p>

            <div className="flex gap-3 w-full">
              {showCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-6 py-4 bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 text-slate-600 dark:text-cream-200/40 rounded-2xl hover:bg-slate-100 dark:hover:bg-dark-700 transition-all font-black text-xs uppercase tracking-widest transform active:scale-95"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                onClick={onConfirm}
                className={`flex-1 px-6 py-4 rounded-2xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-black/20 transform active:scale-95 ${buttonClass}`}
                autoFocus
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-xl transition-all"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
