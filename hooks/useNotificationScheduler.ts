/**
 * Notification Scheduler Hook
 * Intelligently schedules notifications based on user behavior
 */
import { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from '@/services/notificationService';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import { useSettingsStore } from '@/store/settingsStore';

export function useNotificationScheduler() {
    const user = useAuthStore((s) => s.user);
    const streak = useProgressStore((s) => s.stats.streak);
    const lastReadDate = useProgressStore((s) => s.stats.lastReadDate);
    const notificationsEnabled = useSettingsStore((s) => s.settings.notificationsEnabled);

    const scheduleNotifications = useCallback(async () => {
        if (!notificationsEnabled || !user) return;

        try {
            // Schedule daily reading reminder
            await notificationService.scheduleDailyReminder(20, 0);

            // Schedule streak reminder if user has a streak
            if (streak > 0) {
                await notificationService.scheduleStreakReminder(streak);
            }

            // Schedule inactivity reminder if user hasn't read today
            if (lastReadDate) {
                const lastRead = new Date(lastReadDate);
                const today = new Date();
                const daysSinceLastRead = Math.floor(
                    (today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24)
                );

                if (daysSinceLastRead >= 2) {
                    await notificationService.scheduleInactivityReminder(daysSinceLastRead);
                }
            }

            // Schedule daily bonus reminder
            await notificationService.scheduleDailyBonusReminder();
        } catch (error) {
            console.warn('[NotificationScheduler] Failed to schedule:', error);
        }
    }, [notificationsEnabled, user, streak, lastReadDate]);

    // Schedule on mount and when dependencies change
    useEffect(() => {
        scheduleNotifications();
    }, [scheduleNotifications]);

    // Re-schedule when app comes to foreground
    useEffect(() => {
        const handleAppStateChange = (nextState: AppStateStatus) => {
            if (nextState === 'active') {
                scheduleNotifications();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);
        return () => subscription.remove();
    }, [scheduleNotifications]);

    return {
        scheduleNotifications,
    };
}
