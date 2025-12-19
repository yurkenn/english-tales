import { create } from 'zustand';
import { SocialNotification } from '@/types';
import { notificationService } from '@/services/notificationService';

interface NotificationState {
    notifications: SocialNotification[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}

interface NotificationActions {
    setNotifications: (notifications: SocialNotification[]) => void;
    markAsRead: (userId: string, notificationId: string) => Promise<void>;
    markAllAsRead: (userId: string) => Promise<void>;
    clearNotifications: () => void;
}

const initialState: NotificationState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};

export const useNotificationStore = create<NotificationState & { actions: NotificationActions }>()((set, get) => ({
    ...initialState,

    actions: {
        setNotifications: (notifications) => {
            const unreadCount = notifications.filter(n => !n.isRead).length;
            set({ notifications, unreadCount });
        },

        markAsRead: async (userId, notificationId) => {
            await notificationService.markAsRead(userId, notificationId);
            // Optimistic update
            set((state) => {
                const notifications = state.notifications.map(n =>
                    n.id === notificationId ? { ...n, isRead: true } : n
                );
                return {
                    notifications,
                    unreadCount: notifications.filter(n => !n.isRead).length
                };
            });
        },

        markAllAsRead: async (userId) => {
            const { notifications } = get();
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            if (unreadIds.length === 0) return;

            await notificationService.markAllAsRead(userId, unreadIds);

            // Optimistic update
            set((state) => ({
                notifications: state.notifications.map(n => ({ ...n, isRead: true })),
                unreadCount: 0
            }));
        },

        clearNotifications: () => set({ ...initialState }),
    },
}));
