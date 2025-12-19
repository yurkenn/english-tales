import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { notificationService } from '@/services/notificationService';

export const useNotifications = () => {
    const { user } = useAuthStore();
    const { actions: notificationActions } = useNotificationStore();

    useEffect(() => {
        if (!user) {
            notificationActions.clearNotifications();
            return;
        }

        const unsubscribe = notificationService.subscribeToSocialNotifications(user.id, (notifications) => {
            notificationActions.setNotifications(notifications);
        });

        return () => unsubscribe();
    }, [user, notificationActions]);

    return {
        // Any additional helpers could go here
    };
};
