/**
 * Crashlytics Service - Native Firebase Modular API
 */
import { getCrashlytics, log, recordError, setUserId, setAttribute } from '@react-native-firebase/crashlytics';

const crashlytics = getCrashlytics();

class CrashlyticsService {
    log(message: string) {
        console.log(`[Firebase Crashlytics] log: ${message}`);
        try {
            log(crashlytics, message);
        } catch (e) {
            console.warn('[Firebase Crashlytics] log failed', e);
        }
    }

    recordError(error: Error, jsErrorStack?: string) {
        console.log(`[Firebase Crashlytics] recordError: ${error.message}`);
        try {
            if (jsErrorStack) {
                setAttribute(crashlytics, 'js_stack', jsErrorStack);
            }
            recordError(crashlytics, error);
        } catch (e) {
            console.error('[Firebase Crashlytics] recordError failed', e);
        }
    }

    async setUserId(userId: string) {
        console.log(`[Firebase Crashlytics] setUserId: ${userId}`);
        try {
            await setUserId(crashlytics, userId);
        } catch (e) {
            console.error('[Firebase Crashlytics] setUserId failed', e);
        }
    }

    async setAttribute(key: string, value: string) {
        try {
            await setAttribute(crashlytics, key, value);
        } catch (e) {
            console.error('[Firebase Crashlytics] setAttribute failed', e);
        }
    }
}

export const crashlyticsService = new CrashlyticsService();
