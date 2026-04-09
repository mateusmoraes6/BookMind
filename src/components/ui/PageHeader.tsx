import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const PageHeader = ({ title, description, action, className }: PageHeaderProps) => {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
            <div>
                <h1 className="text-3xl font-black text-text dark:text-text-dark leading-tight tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium tracking-wide">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
};
