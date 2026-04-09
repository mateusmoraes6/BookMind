import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Content */}
            <div className={cn(
                "relative w-full max-w-lg bg-surface dark:bg-dark-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-dark-800 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300",
                className
            )}>
                <div className="flex items-center justify-between mb-6">
                    {title ? (
                        <h2 className="text-2xl font-black text-text dark:text-text-dark tracking-tight">
                            {title}
                        </h2>
                    ) : <div />}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full -mr-2"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="custom-scrollbar max-h-[70vh] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
};
