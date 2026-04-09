import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, options, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold uppercase tracking-wider text-text dark:text-text-dark opacity-70">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        className={cn(
                            'flex h-11 w-full appearance-none rounded-xl border border-slate-200 dark:border-dark-800 bg-surface dark:bg-dark-900 px-4 py-2 text-sm text-text dark:text-text-dark ring-offset-bg dark:ring-offset-bg-dark transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                            error && 'border-danger dark:border-danger-dark focus-visible:ring-danger dark:focus-visible:ring-danger-dark',
                            className
                        )}
                        {...props}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {error && (
                    <p className="text-xs font-medium text-danger dark:text-danger-dark">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';
