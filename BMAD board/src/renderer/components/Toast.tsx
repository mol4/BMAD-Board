import { createContext, useContext, useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

export interface Toast {
    id: string;
    message: string;
    variant: ToastVariant;
}

export interface ToastContextValue {
    showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const dismiss = useCallback((id: string) => {
        const timer = timers.current.get(id);
        if (timer !== undefined) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2) + Date.now().toString(36);
        setToasts((prev) => [...prev, { id, message, variant }]);
        const duration = variant === 'error' ? 8000 : 4000;
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
    }, [dismiss]);

    useEffect(() => {
        return () => {
            timers.current.forEach((timer) => clearTimeout(timer));
            timers.current.clear();
        };
    }, []);

    const value = useMemo(() => ({ showToast }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3 px-4 py-3 bg-surface-elevated border border-border-default rounded-md shadow-lg text-sm text-foreground-primary max-w-xs animate-toast-in pointer-events-auto"
                    >
                        {toast.variant === 'success' ? (
                            <CheckCircle2 size={16} className="text-status-done-fg shrink-0" />
                        ) : (
                            <XCircle size={16} className="text-destructive shrink-0" />
                        )}
                        <span className="flex-1">{toast.message}</span>
                        <button
                            onClick={() => dismiss(toast.id)}
                            className="p-0.5 rounded hover:bg-accent-subtle transition-colors duration-100 ease-win11 ml-1 shrink-0"
                            aria-label="Dismiss notification"
                        >
                            <X size={14} className="text-foreground-tertiary" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
