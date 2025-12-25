/**
 * Notification Service - Native Firebase Firestore Modular API
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

class NotificationService {
    private isInitialized = false;

    async registerForPushNotificationsAsync() {
        if (!Device.isDevice) {
            // console.log('Must use physical device for Push Notifications');
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

    async scheduleDailyReminder(hour = 20, minute = 0) {
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

    async cancelAllDailyReminders() {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notification of scheduled) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
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
