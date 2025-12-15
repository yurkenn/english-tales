import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastState {
    toasts: Toast[];
}

interface ToastActions {
    show: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
    hide: (id: string) => void;
    clear: () => void;
}

export const useToastStore = create<ToastState & { actions: ToastActions }>()((set, get) => ({
    toasts: [],

    actions: {
        show: (message, type = 'info', duration = 3000) => {
            const id = Date.now().toString();
            const toast: Toast = { id, message, type, duration };

            set((state) => ({
                toasts: [...state.toasts, toast],
            }));

            // Auto-hide after duration
            if (duration > 0) {
                setTimeout(() => {
                    get().actions.hide(id);
                }, duration);
            }
        },

        success: (message) => get().actions.show(message, 'success', 2500),
        error: (message) => get().actions.show(message, 'error', 4000),
        info: (message) => get().actions.show(message, 'info', 3000),
        warning: (message) => get().actions.show(message, 'warning', 3500),

        hide: (id) => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== id),
            }));
        },

        clear: () => set({ toasts: [] }),
    },
}));
