import { LucideIcon, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({ title, description, icon: Icon, action }: EmptyStateProps) {
  const ActionIcon = action?.icon || Plus;

  return (
    <div className="bg-white dark:bg-dark-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-dark-800 p-12 md:p-16 text-center relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cream-100/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-100/5 dark:bg-dark-800/20 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

      <Icon className="w-20 h-20 text-slate-200 dark:text-dark-800 mx-auto mb-6 relative z-10" />
      
      <h3 className="text-2xl font-black text-slate-900 dark:text-cream-100 mb-2 relative z-10 leading-tight">
        {title}
      </h3>
      
      <p className="text-slate-500 dark:text-cream-200/40 mb-10 max-w-sm mx-auto text-sm font-medium relative z-10">
        {description}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center gap-3 px-10 py-5 bg-cream-100 hover:bg-cream-50 text-dark-950 rounded-2xl transition shadow-2xl shadow-black/40 font-black text-xs uppercase tracking-[0.2em] transform active:scale-95 group relative z-10"
        >
          <ActionIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          {action.label}
        </button>
      )}
    </div>
  );
}
