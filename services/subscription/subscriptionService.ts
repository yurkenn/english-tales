/**
 * RevenueCat Subscription Service
 * Handles all subscription-related operations including paywalls
 */

import Purchases, {
    CustomerInfo,
    PurchasesOffering,
    PurchasesPackage,
    LOG_LEVEL,
    PURCHASES_ERROR_CODE,
} from 'react-native-purchases'
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui'
import { Platform } from 'react-native'

// API Key from environment
const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || ''

// Entitlement identifier from RevenueCat dashboard
export const PREMIUM_ENTITLEMENT = 'english tales Pro'

// Product identifiers (as defined in RevenueCat/Play Console)
export const PRODUCT_IDS = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly',
    LIFETIME: 'lifetime',
} as const

// Package identifiers (RevenueCat standard)
export const PACKAGE_IDS = {
    MONTHLY: '$rc_monthly',
    YEARLY: '$rc_annual',
    LIFETIME: '$rc_lifetime',
} as const

class SubscriptionService {
    private isInitialized = false
    private customerInfoListener: ((info: CustomerInfo) => void) | null = null

    /**
     * Initialize RevenueCat SDK
     * Should be called once at app startup
     */
    async initialize(userId?: string): Promise<boolean> {
        if (this.isInitialized) return true

        if (!REVENUECAT_API_KEY) {
            console.warn('[SubscriptionService] No API key configured. Subscriptions disabled.')
            return false
        }

        try {
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.DEBUG)
            }

            Purchases.configure({
                apiKey: REVENUECAT_API_KEY,
            })

            if (userId) {
                await Purchases.logIn(userId)
                console.log('[SubscriptionService] Logged in user:', userId)
            }

            this.isInitialized = true
            console.log('[SubscriptionService] Initialized successfully')
            return true
        } catch (error) {
            console.error('[SubscriptionService] Failed to initialize:', error)
            return false
        }
    }

    /**
     * Get current offerings (available subscription packages)
     */
    async getOfferings(): Promise<PurchasesOffering | null> {
        try {
            const offerings = await Purchases.getOfferings()
            console.log('[SubscriptionService] Offerings:', offerings.current?.identifier)
            return offerings.current
        } catch (error) {
            console.error('[SubscriptionService] Failed to get offerings:', error)
            return null
        }
    }

    /**
     * Get all available packages from the current offering
     */
    async getPackages(): Promise<PurchasesPackage[]> {
        const offering = await this.getOfferings()
        return offering?.availablePackages || []
    }

    /**
     * Purchase a subscription package
     */
    async purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pkg)
            console.log('[SubscriptionService] Purchase successful')
            return customerInfo
        } catch (error: any) {
            if (error.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
                console.log('[SubscriptionService] User cancelled purchase')
                return null
            }
            console.error('[SubscriptionService] Purchase failed:', error)
            throw error
        }
    }

    /**
     * Present RevenueCat's built-in paywall UI
     * This is the recommended way to show paywalls
     */
    async presentPaywall(): Promise<{
        success: boolean
        customerInfo?: CustomerInfo
    }> {
        try {
            const result = await RevenueCatUI.presentPaywall()

            switch (result) {
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    const customerInfo = await this.getCustomerInfo()
                    return { success: true, customerInfo: customerInfo || undefined }
                case PAYWALL_RESULT.NOT_PRESENTED:
                case PAYWALL_RESULT.ERROR:
                case PAYWALL_RESULT.CANCELLED:
                default:
                    return { success: false }
            }
        } catch (error) {
            console.error('[SubscriptionService] Paywall error:', error)
            return { success: false }
        }
    }

    /**
     * Present paywall only if user doesn't have the entitlement
     */
    async presentPaywallIfNeeded(): Promise<{
        success: boolean
        customerInfo?: CustomerInfo
    }> {
        try {
            const result = await RevenueCatUI.presentPaywallIfNeeded({
                requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT,
            })

            switch (result) {
                case PAYWALL_RESULT.PURCHASED:
                case PAYWALL_RESULT.RESTORED:
                    const customerInfo = await this.getCustomerInfo()
                    return { success: true, customerInfo: customerInfo || undefined }
                case PAYWALL_RESULT.NOT_PRESENTED:
                    // User already has entitlement
                    return { success: true }
                case PAYWALL_RESULT.ERROR:
                case PAYWALL_RESULT.CANCELLED:
                default:
                    return { success: false }
            }
        } catch (error) {
            console.error('[SubscriptionService] Paywall error:', error)
            return { success: false }
        }
    }

    /**
     * Restore previous purchases
     */
    async restorePurchases(): Promise<CustomerInfo> {
        try {
            const customerInfo = await Purchases.restorePurchases()
            console.log('[SubscriptionService] Restore completed')
            return customerInfo
        } catch (error) {
            console.error('[SubscriptionService] Restore failed:', error)
            throw error
        }
    }

    /**
     * Get current customer info
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        try {
            return await Purchases.getCustomerInfo()
        } catch (error) {
            console.error('[SubscriptionService] Failed to get customer info:', error)
            return null
        }
    }

    /**
     * Check if user has active premium subscription
     */
    async isPremium(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo()
            const hasPremium = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined
            console.log('[SubscriptionService] isPremium:', hasPremium)
            return hasPremium
        } catch (error) {
            console.error('[SubscriptionService] Failed to check premium status:', error)
            return false
        }
    }

    /**
     * Check if user has a specific entitlement
     */
    async hasEntitlement(entitlementId: string): Promise<boolean> {
        try {
            const customerInfo = await Purchases.getCustomerInfo()
            return customerInfo.entitlements.active[entitlementId] !== undefined
        } catch (error) {
            console.error('[SubscriptionService] Failed to check entitlement:', error)
            return false
        }
    }

    /**
     * Get premium subscription expiration date
     */
    async getExpirationDate(): Promise<Date | null> {
        try {
            const customerInfo = await Purchases.getCustomerInfo()
            const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]
            if (entitlement?.expirationDate) {
                return new Date(entitlement.expirationDate)
            }
            return null
        } catch (error) {
            console.error('[SubscriptionService] Failed to get expiration:', error)
            return null
        }
    }

    /**
     * Get subscription type (monthly, yearly, lifetime)
     */
    async getSubscriptionType(): Promise<'monthly' | 'yearly' | 'lifetime' | null> {
        try {
            const customerInfo = await Purchases.getCustomerInfo()
            const entitlement = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT]

            if (!entitlement) return null

            const productId = entitlement.productIdentifier.toLowerCase()

            if (productId.includes('lifetime')) return 'lifetime'
            if (productId.includes('yearly') || productId.includes('annual')) return 'yearly'
            if (productId.includes('monthly')) return 'monthly'

            return null
        } catch (error) {
            console.error('[SubscriptionService] Failed to get subscription type:', error)
            return null
        }
    }

    /**
     * Listen for customer info changes
     */
    addCustomerInfoListener(listener: (info: CustomerInfo) => void): () => void {
        this.customerInfoListener = listener
        Purchases.addCustomerInfoUpdateListener(listener)

        return () => {
            this.customerInfoListener = null
            // Note: RevenueCat SDK doesn't have a remove listener method
            // The listener will be garbage collected
        }
    }

    /**
     * Log in a user (sync purchases with user account)
     */
    async logIn(userId: string): Promise<CustomerInfo | null> {
        try {
            const { customerInfo } = await Purchases.logIn(userId)
            console.log('[SubscriptionService] User logged in:', userId)
            return customerInfo
        } catch (error) {
            console.error('[SubscriptionService] Login failed:', error)
            return null
        }
    }

    /**
     * Log out current user
     */
    async logOut(): Promise<void> {
        try {
            await Purchases.logOut()
            console.log('[SubscriptionService] User logged out')
        } catch (error) {
            console.error('[SubscriptionService] Logout failed:', error)
        }
    }

    /**
     * Get customer center URL (for self-service subscription management)
     */
    getManageSubscriptionsUrl(): string {
        return 'https://play.google.com/store/account/subscriptions'
    }
}

export const subscriptionService = new SubscriptionService()
