import appCheck from '@react-native-firebase/app-check'
import { appCheckLogger as logger } from '@/utils/logger'

/**
 * Initialize Firebase App Check for security.
 * App Check helps protect your backend resources from abuse.
 * 
 * Important: Configure in Firebase Console:
 * - Firebase Console → App Check → Apps → Register
 * - For Android: Enable Play Integrity
 * - For iOS: Enable DeviceCheck or App Attest
 */
class AppCheckService {
    private initialized = false

    /**
     * Initialize App Check
     * Should be called early in app startup
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            logger.log('Already initialized')
            return
        }

        try {
            // For debug builds, use debug provider
            if (__DEV__) {
                // In development, you can use debug token
                // Get debug token from logs and add to Firebase Console
                const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider()
                rnfbProvider.configure({
                    android: {
                        provider: 'debug',
                    },
                    apple: {
                        provider: 'debug',
                    },
                })
                await appCheck().initializeAppCheck({
                    provider: rnfbProvider,
                    isTokenAutoRefreshEnabled: true,
                })
                logger.log('Initialized with debug provider')
            } else {
                // In production, use Play Integrity (Android) or App Attest (iOS)
                const rnfbProvider = appCheck().newReactNativeFirebaseAppCheckProvider()
                rnfbProvider.configure({
                    android: {
                        provider: 'playIntegrity',
                    },
                    apple: {
                        provider: 'appAttest',
                    },
                })
                await appCheck().initializeAppCheck({
                    provider: rnfbProvider,
                    isTokenAutoRefreshEnabled: true,
                })
                logger.log('Initialized with production provider')
            }

            this.initialized = true
        } catch (error) {
            logger.error('Initialization failed:', error)
            // Don't throw - app should still work without App Check
            // but Firebase requests may fail if enforcement is enabled
        }
    }

    /**
     * Get current App Check token
     * Useful for debugging
     */
    async getToken(): Promise<string | null> {
        try {
            const { token } = await appCheck().getToken(true)
            return token
        } catch (error) {
            logger.error('Failed to get token:', error)
            return null
        }
    }

    /**
     * Check if App Check is supported on this device
     */
    isSupported(): boolean {
        return true // React Native Firebase supports App Check on both platforms
    }
}

export const appCheckService = new AppCheckService()
