/**
 * Analytics Service - Native Firebase Modular API
 */
import { getAnalytics, logEvent, logScreenView, setUserId, setUserProperties } from '@react-native-firebase/analytics';

const analytics = getAnalytics();

class AnalyticsService {
    async logScreenView(screenName: string, screenClass?: string) {
        console.log(`[Firebase Analytics] logScreenView: ${screenName}`);
        try {
            await logScreenView(analytics, {
                screen_name: screenName,
                screen_class: screenClass || screenName,
            });
        } catch (error) {
            console.error('[Firebase Analytics] logScreenView failed', error);
        }
    }

    async logEvent(name: string, params: Record<string, any> = {}) {
        console.log(`[Firebase Analytics] logEvent: ${name}`, params);
        try {
            await logEvent(analytics, name, params);
        } catch (error) {
            console.error(`[Firebase Analytics] logEvent "${name}" failed`, error);
        }
    }

    async setUserId(userId: string | null) {
        console.log(`[Firebase Analytics] setUserId: ${userId}`);
        try {
            await setUserId(analytics, userId);
        } catch (error) {
            console.error('[Firebase Analytics] setUserId failed', error);
        }
    }

    async setUserProperties(properties: Record<string, string | null>) {
        console.log('[Firebase Analytics] setUserProperties', properties);
        try {
            await setUserProperties(analytics, properties);
        } catch (error) {
            console.error('[Firebase Analytics] setUserProperties failed', error);
        }
    }
}

export const analyticsService = new AnalyticsService();
