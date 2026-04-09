import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, ...props }, ref) => {
        return (
            <div className="w-full space-y-1.5">
                {label && (
                    <label className="text-xs font-bold uppercase tracking-wider text-text dark:text-text-dark opacity-70">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={cn(
                        'flex h-11 w-full rounded-xl border border-slate-200 dark:border-dark-800 bg-surface dark:bg-dark-900 px-4 py-2 text-sm text-text dark:text-text-dark ring-offset-bg dark:ring-offset-bg-dark transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                        error && 'border-danger dark:border-danger-dark focus-visible:ring-danger dark:focus-visible:ring-danger-dark',
                        className
                    )}
                    {...props}
                />
                {error && (
                    <p className="text-xs font-medium text-danger dark:text-danger-dark">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
