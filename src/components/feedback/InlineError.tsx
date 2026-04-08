import { AlertCircle, RefreshCw } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export function InlineError({ message, onRetry }: InlineErrorProps) {
  return (
    <div className="bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/30 p-8 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      
      <h3 className="text-xl font-black text-red-900 dark:text-red-100 mb-2">
        Ops! Algo deu errado
      </h3>
      
      <p className="text-red-700/70 dark:text-red-400/60 mb-8 font-medium">
        {message || 'Não foi possível carregar os dados no momento.'}
      </p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all shadow-lg shadow-red-600/20 font-bold text-sm transform active:scale-95 group"
        >
          <RefreshCw className="w-4 h-4 transition-transform group-hover:rotate-180 duration-500" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
