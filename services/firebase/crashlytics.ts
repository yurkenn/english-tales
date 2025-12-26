/**
 * Crashlytics Service - Native Firebase Modular API
 */
import { getCrashlytics, log, recordError, setUserId, setAttribute } from '@react-native-firebase/crashlytics'
import { crashlyticsLogger as logger } from '@/utils/logger'

const crashlytics = getCrashlytics()

class CrashlyticsService {
    log(message: string) {
        logger.log(`log: ${message}`)
        try {
            log(crashlytics, message)
        } catch (e) {
            logger.warn('log failed', e)
        }
    }

    recordError(error: Error, jsErrorStack?: string) {
        logger.log(`recordError: ${error.message}`)
        try {
            if (jsErrorStack) {
                setAttribute(crashlytics, 'js_stack', jsErrorStack)
            }
            recordError(crashlytics, error)
        } catch (e) {
            logger.error('recordError failed', e)
        }
    }

    async setUserId(userId: string) {
        logger.log(`setUserId: ${userId}`)
        try {
            await setUserId(crashlytics, userId)
        } catch (e) {
            logger.error('setUserId failed', e)
        }
    }

    async setAttribute(key: string, value: string) {
        try {
            await setAttribute(crashlytics, key, value)
        } catch (e) {
            logger.error('setAttribute failed', e)
        }
    }
}

export const crashlyticsService = new CrashlyticsService()
