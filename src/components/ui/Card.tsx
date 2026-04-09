import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    elevated?: boolean;
}

export const Card = ({ className, elevated = false, ...props }: CardProps) => {
    return (
        <div
            className={cn(
                'rounded-2xl border border-slate-200 dark:border-dark-800 bg-surface dark:bg-dark-900 transition-all duration-300',
                elevated ? 'shadow-lg' : 'shadow-sm',
                className
            )}
            {...props}
        />
    );
};

export const CardHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
);

export const CardTitle = ({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn('text-lg font-black leading-none tracking-tight text-text dark:text-text-dark', className)} {...props} />
);

export const CardDescription = ({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className={cn('text-sm text-slate-500 dark:text-slate-400', className)} {...props} />
);

export const CardContent = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
