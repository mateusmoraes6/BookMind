import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
}

export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
    const variants = {
        default: 'bg-slate-100 dark:bg-dark-800 text-slate-900 dark:text-cream-100',
        success: 'bg-success/10 border border-success/20 text-success dark:text-success-dark',
        warning: 'bg-warning/10 border border-warning/20 text-warning dark:text-warning-dark',
        danger: 'bg-danger/10 border border-danger/20 text-danger dark:text-danger-dark',
        info: 'bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400',
        outline: 'border border-slate-200 dark:border-dark-700 text-text dark:text-text-dark',
    };

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                variants[variant],
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
