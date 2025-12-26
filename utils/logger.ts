/**
 * Logger utility for safe console logging
 * Only logs in development mode (__DEV__)
 * 
 * Usage:
 * import { logger } from '@/utils/logger'
 * logger.log('message')
 * logger.error('Error:', error)
 * logger.warn('Warning message')
 */

const isDev = __DEV__

type LogLevel = 'log' | 'error' | 'warn' | 'info' | 'debug'

const createLogger = (prefix?: string) => {
    const formatMessage = (level: LogLevel, args: any[]) => {
        if (prefix) {
            return [`[${prefix}]`, ...args]
        }
        return args
    }

    return {
        log: (...args: any[]) => {
            if (isDev) console.log(...formatMessage('log', args))
        },

        error: (...args: any[]) => {
            // Errors are always logged for crash reporting
            console.error(...formatMessage('error', args))
        },

        warn: (...args: any[]) => {
            if (isDev) console.warn(...formatMessage('warn', args))
        },

        info: (...args: any[]) => {
            if (isDev) console.info(...formatMessage('info', args))
        },

        debug: (...args: any[]) => {
            if (isDev) console.debug(...formatMessage('debug', args))
        },
    }
}

// Default logger
export const logger = createLogger()

// Create a prefixed logger for specific modules
export const createModuleLogger = (moduleName: string) => createLogger(moduleName)

// Pre-built module loggers for common services
export const firebaseLogger = createLogger('Firebase')
export const appCheckLogger = createLogger('App Check')
export const analyticsLogger = createLogger('Analytics')
export const crashlyticsLogger = createLogger('Crashlytics')
export const perfLogger = createLogger('Performance')
export const communityLogger = createLogger('Community')
export const socialLogger = createLogger('Social')
export const userLogger = createLogger('User')
