/**
 * Analytics Service - Native Firebase Modular API
 */
import { getAnalytics, logEvent, logScreenView, setUserId, setUserProperties } from '@react-native-firebase/analytics'
import { analyticsLogger as logger } from '@/utils/logger'

const analytics = getAnalytics()

class AnalyticsService {
    async logScreenView(screenName: string, screenClass?: string) {
        logger.log(`logScreenView: ${screenName}`)
        try {
            await logScreenView(analytics, {
                screen_name: screenName,
                screen_class: screenClass || screenName,
            })
        } catch (error) {
            logger.error('logScreenView failed', error)
        }
    }

    async logEvent(name: string, params: Record<string, any> = {}) {
        logger.log(`logEvent: ${name}`, params)
        try {
            await logEvent(analytics, name, params)
        } catch (error) {
            logger.error(`logEvent "${name}" failed`, error)
        }
    }

    async setUserId(userId: string | null) {
        logger.log(`setUserId: ${userId}`)
        try {
            await setUserId(analytics, userId)
        } catch (error) {
            logger.error('setUserId failed', error)
        }
    }

    async setUserProperties(properties: Record<string, string | null>) {
        logger.log('setUserProperties', properties)
        try {
            await setUserProperties(analytics, properties)
        } catch (error) {
            logger.error('setUserProperties failed', error)
        }
    }
}

export const analyticsService = new AnalyticsService()
