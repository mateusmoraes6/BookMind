import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

        const variants = {
            primary: 'bg-primary dark:bg-primary-dark text-white hover:opacity-90 shadow-sm',
            secondary: 'bg-surface dark:bg-surface-dark text-text dark:text-text-dark border border-slate-200 dark:border-dark-800 hover:bg-slate-50 dark:hover:bg-dark-800',
            outline: 'bg-transparent border-2 border-primary dark:border-primary-dark text-primary dark:text-primary-dark hover:bg-primary/5',
            ghost: 'bg-transparent text-text dark:text-text-dark hover:bg-slate-100 dark:hover:bg-dark-900',
            danger: 'bg-danger dark:bg-danger-dark text-white hover:opacity-90 shadow-sm',
            success: 'bg-success dark:bg-success-dark text-white hover:opacity-90 shadow-sm',
            warning: 'bg-warning dark:bg-warning-dark text-white hover:opacity-90 shadow-sm',
        };

        const sizes = {
            sm: 'h-9 px-3 text-xs',
            md: 'min-h-[44px] px-4 text-sm',
            lg: 'h-12 px-6 text-base',
            icon: 'min-h-[44px] min-w-[44px]',
        };

        return (
            <button
                ref={ref}
                disabled={disabled || isLoading}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            >
                {isLoading ? (
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
