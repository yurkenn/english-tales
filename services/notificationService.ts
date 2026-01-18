/**
 * Notification Service - Native Firebase Firestore Modular API
 * Enhanced with streak reminders, daily bonus, and inactivity alerts
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    query,
    orderBy,
    onSnapshot,
    writeBatch,
    serverTimestamp,
} from '@react-native-firebase/firestore';
import { SocialNotification } from '@/types';

const db = getFirestore();

// Notification channel IDs for Android
const CHANNELS = {
    DAILY_REMINDER: 'daily_reminder',
    STREAK: 'streak',
    SOCIAL: 'social',
    BONUS: 'bonus',
} as const;

class NotificationService {
    private isInitialized = false;
    private scheduledIds: Record<string, string> = {};

    async registerForPushNotificationsAsync() {
        if (!Device.isDevice) {
            return null;
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            return null;
        }

        // Setup Android notification channels
        if (Platform.OS === 'android') {
            await this.setupAndroidChannels();
        }

        return (await Notifications.getExpoPushTokenAsync()).data;
    }

    private async setupAndroidChannels() {
        // Daily reminder channel
        await Notifications.setNotificationChannelAsync(CHANNELS.DAILY_REMINDER, {
            name: 'Daily Reading Reminder',
            description: 'Daily reminders to continue your reading journey',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#4F46E5',
            sound: 'default',
        });

        // Streak channel (high priority)
        await Notifications.setNotificationChannelAsync(CHANNELS.STREAK, {
            name: 'Streak Protection',
            description: 'Important alerts about your reading streak',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 500, 200, 500],
            lightColor: '#EF4444',
            sound: 'default',
        });

        // Social channel
        await Notifications.setNotificationChannelAsync(CHANNELS.SOCIAL, {
            name: 'Social Updates',
            description: 'Likes, comments, and friend activity',
            importance: Notifications.AndroidImportance.DEFAULT,
            sound: 'default',
        });

        // Daily bonus channel
        await Notifications.setNotificationChannelAsync(CHANNELS.BONUS, {
            name: 'Daily Bonus',
            description: 'Daily bonus and reward notifications',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250],
            lightColor: '#F59E0B',
            sound: 'default',
        });
    }

    async scheduleDailyReminder(hour = 20, minute = 0) {
        await this.cancelScheduledNotification('daily_reminder');

        const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "📚 Time for a Story!",
                body: "Consistency is key to learning. Read a short story and grow your vocabulary today!",
                data: { screen: 'home', type: 'daily_reminder' },
                ...(Platform.OS === 'android' && { channelId: CHANNELS.DAILY_REMINDER }),
            },
            trigger,
        });

        this.scheduledIds['daily_reminder'] = notificationId;
        return notificationId;
    }

    async scheduleStreakReminder(currentStreak: number) {
        await this.cancelScheduledNotification('streak_reminder');

        // Schedule for evening (7 PM) if user hasn't read today
        const now = new Date();
        let triggerDate = new Date();
        triggerDate.setHours(19, 0, 0, 0);

        // If it's already past 7 PM, schedule for next window (9 PM)
        if (now > triggerDate) {
            triggerDate.setHours(21, 0, 0, 0);
        }

        // If it's past 9 PM, schedule for tomorrow morning
        if (now > triggerDate) {
            triggerDate.setDate(triggerDate.getDate() + 1);
            triggerDate.setHours(9, 0, 0, 0);
        }

        const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        };

        const messages = [
            `🔥 Don't lose your ${currentStreak}-day streak!`,
            `⏰ Your ${currentStreak}-day streak is at risk!`,
            `📖 Just a few minutes to protect your ${currentStreak}-day streak!`,
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: randomMessage,
                body: "Open the app and read for just 5 minutes to keep your streak alive!",
                data: { screen: 'home', type: 'streak_reminder', streak: currentStreak },
                ...(Platform.OS === 'android' && { channelId: CHANNELS.STREAK }),
            },
            trigger,
        });

        this.scheduledIds['streak_reminder'] = notificationId;
        return notificationId;
    }

    async scheduleDailyBonusReminder() {
        await this.cancelScheduledNotification('daily_bonus');

        // Schedule for 10 AM daily
        const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 10,
            minute: 0,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "🎁 Your Daily Bonus is Ready!",
                body: "Claim your free coins and keep your streak going!",
                data: { screen: 'home', type: 'daily_bonus' },
                ...(Platform.OS === 'android' && { channelId: CHANNELS.BONUS }),
            },
            trigger,
        });

        this.scheduledIds['daily_bonus'] = notificationId;
        return notificationId;
    }

    async scheduleInactivityReminder(daysSinceLastRead: number) {
        await this.cancelScheduledNotification('inactivity');

        // Don't schedule if they've been inactive for too long (might be churned)
        if (daysSinceLastRead > 14) return null;

        // Schedule for tomorrow at 6 PM
        const triggerDate = new Date();
        triggerDate.setDate(triggerDate.getDate() + 1);
        triggerDate.setHours(18, 0, 0, 0);

        const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
        };

        const messages = [
            { title: "📚 We miss you!", body: "There are new stories waiting for you. Come back and explore!" },
            { title: "🌟 New stories await!", body: "Discover fresh tales and continue your English journey." },
            { title: "📖 Ready to read?", body: "Your next adventure is just a tap away!" },
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: randomMessage.title,
                body: randomMessage.body,
                data: { screen: 'home', type: 'inactivity', days_inactive: daysSinceLastRead },
                ...(Platform.OS === 'android' && { channelId: CHANNELS.DAILY_REMINDER }),
            },
            trigger,
        });

        this.scheduledIds['inactivity'] = notificationId;
        return notificationId;
    }

    async scheduleNewStoryNotification(storyTitle: string, storyId: string, delayMinutes = 0) {
        const triggerDate = new Date(Date.now() + delayMinutes * 60 * 1000);

        const trigger: Notifications.NotificationTriggerInput = delayMinutes > 0
            ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate }
            : null;

        return await Notifications.scheduleNotificationAsync({
            content: {
                title: "✨ New Story Available!",
                body: `"${storyTitle}" is now available to read.`,
                data: { screen: 'story', storyId, type: 'new_story' },
                ...(Platform.OS === 'android' && { channelId: CHANNELS.DAILY_REMINDER }),
            },
            trigger,
        });
    }

    private async cancelScheduledNotification(key: string) {
        const id = this.scheduledIds[key];
        if (id) {
            try {
                await Notifications.cancelScheduledNotificationAsync(id);
                delete this.scheduledIds[key];
            } catch {
                // Notification might already be cancelled
            }
        }
    }

    async cancelAllDailyReminders() {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduled) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
        this.scheduledIds = {};
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    shouldShowBanner: true,
                    shouldShowList: true,
                }),
            });

            const token = await this.registerForPushNotificationsAsync();
            if (token) {
                await this.scheduleDailyReminder(20, 0);
                await this.scheduleDailyBonusReminder();
            }
            this.isInitialized = true;
        } catch (e) {
            console.warn('[NotificationService] Failed to initialize:', e);
        }
    }

    async createSocialNotification(targetUserId: string, data: Omit<SocialNotification, 'id' | 'timestamp' | 'isRead'>) {
        try {
            await addDoc(collection(db, 'users', targetUserId, 'notifications'), {
                ...data,
                isRead: false,
                timestamp: serverTimestamp(),
            });
        } catch {
            // Silently ignore - requires Cloud Functions due to security rules
        }
    }

    subscribeToSocialNotifications(userId: string, callback: (notifications: SocialNotification[]) => void) {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            orderBy('timestamp', 'desc')
        );

        return onSnapshot(q, snapshot => {
            const notifications = snapshot.docs.map((d: any) => ({
                id: d.id,
                ...d.data()
            } as SocialNotification));
            callback(notifications);
        });
    }

    async markAsRead(userId: string, notificationId: string) {
        try {
            await updateDoc(doc(db, 'users', userId, 'notifications', notificationId), { isRead: true });
        } catch (error) {
            console.error('[NotificationService] Failed to mark as read:', error);
        }
    }

    async markAllAsRead(userId: string, notificationIds: string[]) {
        try {
            const batch = writeBatch(db);
            notificationIds.forEach(id => {
                const docRef = doc(db, 'users', userId, 'notifications', id);
                batch.update(docRef, { isRead: true });
            });
            await batch.commit();
        } catch (error) {
            console.error('[NotificationService] Failed to mark all as read:', error);
        }
    }
}

export const notificationService = new NotificationService();
