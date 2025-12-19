import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from './firebase/config';
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    writeBatch
} from 'firebase/firestore';
import { SocialNotification } from '@/types';

// Configure notification behavior
class NotificationService {
    private isInitialized = false;

    /**
     * Request permissions and return token (if needed for remote)
     */
    async registerForPushNotificationsAsync() {
        if (!Device.isDevice) {
            console.log('Must use physical device for Push Notifications');
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

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return (await Notifications.getExpoPushTokenAsync()).data;
    }

    /**
     * Schedule a daily reminder notification
     */
    async scheduleDailyReminder(hour = 20, minute = 0) {
        // Cancel existing reminders
        await this.cancelAllDailyReminders();

        const trigger: Notifications.NotificationTriggerInput = {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour,
            minute,
        };

        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "📚 Time for a Story!",
                body: "Consistency is key to learning. Read a short story and grow your vocabulary today!",
                data: { screen: 'home' },
            },
            trigger,
        });

        return notificationId;
    }

    /**
     * Cancel all daily reminders
     */
    async cancelAllDailyReminders() {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduled) {
            // We can identify daily ones if we want, or just clear all
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
    }

    /**
     * Initialize notifications and schedule default reminder
     */
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Configure notification behavior
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
                await this.scheduleDailyReminder(20, 0); // Default 8 PM
            }
            this.isInitialized = true;
        } catch (e) {
            console.warn('[NotificationService] Failed to initialize notifications:', e);
        }
    }
    /**
     * Internal helper to create a social notification in Firestore
     */
    async createSocialNotification(targetUserId: string, data: Omit<SocialNotification, 'id' | 'timestamp' | 'isRead'>) {
        try {
            const notificationsRef = collection(db, 'users', targetUserId, 'notifications');
            await addDoc(notificationsRef, {
                ...data,
                isRead: false,
                timestamp: serverTimestamp(),
            });
        } catch (error) {
            console.error('[NotificationService] Failed to create social notification:', error);
        }
    }

    /**
     * Subscribe to real-time notification updates
     */
    subscribeToSocialNotifications(userId: string, callback: (notifications: SocialNotification[]) => void) {
        const q = query(
            collection(db, 'users', userId, 'notifications'),
            orderBy('timestamp', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as SocialNotification));
            callback(notifications);
        });
    }

    /**
     * Mark a specific notification as read
     */
    async markAsRead(userId: string, notificationId: string) {
        try {
            const docRef = doc(db, 'users', userId, 'notifications', notificationId);
            await updateDoc(docRef, { isRead: true });
        } catch (error) {
            console.error('[NotificationService] Failed to mark as read:', error);
        }
    }

    /**
     * Mark all notifications as read
     */
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
