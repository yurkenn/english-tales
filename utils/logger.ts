/**
 * Logger utility for development and production
 * Automatically filters out logs in production builds
 */

const isDev = __DEV__;

export const logger = {
    log: (...args: unknown[]) => {
        if (isDev) {
            console.log(...args);
        }
    },
    warn: (...args: unknown[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },
    error: (...args: unknown[]) => {
        // Always log errors, even in production
        console.error(...args);
    },
    info: (...args: unknown[]) => {
        if (isDev) {
            console.info(...args);
        }
    },
    debug: (...args: unknown[]) => {
        if (isDev) {
            console.debug(...args);
        }
    },
};

