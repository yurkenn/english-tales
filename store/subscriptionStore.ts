/**
 * Subscription Store
 * Manages premium subscription state using RevenueCat
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { PurchasesOffering, PurchasesPackage, CustomerInfo } from 'react-native-purchases'
import { subscriptionService, PREMIUM_ENTITLEMENT } from '@/services/subscription'
import { userService } from '@/services/userService'

interface SubscriptionState {
    // Status
    isPremium: boolean
    isInitialized: boolean
    isLoading: boolean

    // Subscription details
    subscriptionType: 'monthly' | 'yearly' | 'lifetime' | null
    expiresAt: Date | null

    // User tracking for Firestore sync
    currentUserId: string | null

    // Offerings
    offerings: PurchasesOffering | null
    packages: PurchasesPackage[]

    // Error state
    error: string | null
}

interface SubscriptionActions {
    initialize: (userId?: string) => Promise<void>
    loginUser: (userId: string) => Promise<void>
    checkPremiumStatus: () => Promise<boolean>
    validatePremiumStatus: () => Promise<void>
    fetchOfferings: () => Promise<void>
    purchase: (pkg: PurchasesPackage) => Promise<boolean>
    restore: () => Promise<boolean>
    presentPaywall: () => Promise<boolean>
    presentPaywallIfNeeded: () => Promise<boolean>
    reset: () => void
    syncWithCustomerInfo: (info: CustomerInfo) => void
}

const initialState: SubscriptionState = {
    isPremium: false,
    isInitialized: false,
    isLoading: false,
    subscriptionType: null,
    expiresAt: null,
    currentUserId: null,
    offerings: null,
    packages: [],
    error: null,
}

export const useSubscriptionStore = create<SubscriptionState & { actions: SubscriptionActions }>()(
    persist(
        (set, get) => ({
            ...initialState,
            actions: {
                initialize: async (userId?: string) => {
                    if (get().isInitialized) return

                    set({ isLoading: true, error: null, currentUserId: userId || null })

                    try {
                        const success = await subscriptionService.initialize(userId)
                        if (success) {
                            // Check premium status
                            await get().actions.checkPremiumStatus()
                            // Fetch available packages
                            await get().actions.fetchOfferings()
                        }
                        set({ isInitialized: success, isLoading: false })
                    } catch (error) {
                        console.error('[SubscriptionStore] Init failed:', error)
                        set({ isLoading: false, error: 'Failed to initialize subscriptions' })
                    }
                },

                loginUser: async (userId: string) => {
                    try {
                        // Update stored userId
                        set({ currentUserId: userId })

                        // Login to RevenueCat to sync purchases with user account
                        const customerInfo = await subscriptionService.logIn(userId)
                        if (customerInfo) {
                            get().actions.syncWithCustomerInfo(customerInfo)
                            console.log('[SubscriptionStore] User logged in to RevenueCat:', userId)
                        }
                    } catch (error) {
                        console.error('[SubscriptionStore] Failed to login user:', error)
                    }
                },

                checkPremiumStatus: async () => {
                    try {
                        const customerInfo = await subscriptionService.getCustomerInfo()
                        if (customerInfo) {
                            get().actions.syncWithCustomerInfo(customerInfo)
                            return get().isPremium
                        }
                        return false
                    } catch (error) {
                        console.error('[SubscriptionStore] Status check failed:', error)
                        return false
                    }
                },

                validatePremiumStatus: async () => {
                    const { isPremium, expiresAt, subscriptionType } = get()

                    // If not premium, nothing to validate
                    if (!isPremium) return

                    // Lifetime subscriptions don't expire
                    if (subscriptionType === 'lifetime') return

                    // Check if cached premium has expired
                    if (expiresAt) {
                        const now = new Date()
                        const expiration = new Date(expiresAt)

                        if (now > expiration) {
                            console.log('[SubscriptionStore] Cached premium expired, re-verifying with RevenueCat...')
                            // Re-verify with RevenueCat
                            await get().actions.checkPremiumStatus()
                        }
                    } else {
                        // No expiration date cached, re-verify to be safe
                        console.log('[SubscriptionStore] No expiration date, verifying premium status...')
                        await get().actions.checkPremiumStatus()
                    }
                },

                fetchOfferings: async () => {
                    try {
                        const offerings = await subscriptionService.getOfferings()
                        const packages = offerings?.availablePackages || []
                        set({ offerings, packages })
                    } catch (error) {
                        console.error('[SubscriptionStore] Fetch offerings failed:', error)
                    }
                },

                purchase: async (pkg: PurchasesPackage) => {
                    set({ isLoading: true, error: null })

                    try {
                        const customerInfo = await subscriptionService.purchasePackage(pkg)
                        if (customerInfo) {
                            get().actions.syncWithCustomerInfo(customerInfo)
                            set({ isLoading: false })
                            return get().isPremium
                        }
                        set({ isLoading: false })
                        return false
                    } catch (error: any) {
                        set({
                            isLoading: false,
                            error: error.message || 'Purchase failed',
                        })
                        return false
                    }
                },

                restore: async () => {
                    set({ isLoading: true, error: null })

                    try {
                        const customerInfo = await subscriptionService.restorePurchases()
                        get().actions.syncWithCustomerInfo(customerInfo)
                        set({ isLoading: false })

                        if (!get().isPremium) {
                            set({ error: 'No active subscription found' })
                        }

                        return get().isPremium
                    } catch (error: any) {
                        set({
                            isLoading: false,
                            error: error.message || 'Restore failed',
                        })
                        return false
                    }
                },

                reset: () => {
                    set(initialState)
                },

                presentPaywall: async () => {
                    set({ isLoading: true, error: null })
                    try {
                        const result = await subscriptionService.presentPaywall()
                        if (result.customerInfo) {
                            get().actions.syncWithCustomerInfo(result.customerInfo)
                        }
                        set({ isLoading: false })
                        return result.success
                    } catch (error: any) {
                        set({ isLoading: false, error: error.message })
                        return false
                    }
                },

                presentPaywallIfNeeded: async () => {
                    set({ isLoading: true, error: null })
                    try {
                        const result = await subscriptionService.presentPaywallIfNeeded()
                        if (result.customerInfo) {
                            get().actions.syncWithCustomerInfo(result.customerInfo)
                        }
                        set({ isLoading: false })
                        return result.success
                    } catch (error: any) {
                        set({ isLoading: false, error: error.message })
                        return false
                    }
                },

                syncWithCustomerInfo: (info: CustomerInfo) => {
                    const entitlement = info.entitlements.active[PREMIUM_ENTITLEMENT]
                    const isPremium = entitlement !== undefined

                    let subscriptionType: SubscriptionState['subscriptionType'] = null
                    if (entitlement) {
                        const productId = entitlement.productIdentifier.toLowerCase()
                        if (productId.includes('yearly') || productId.includes('annual')) {
                            subscriptionType = 'yearly'
                        } else if (productId.includes('monthly')) {
                            subscriptionType = 'monthly'
                        } else if (productId.includes('lifetime')) {
                            subscriptionType = 'lifetime'
                        }
                    }

                    const expiresAt = entitlement?.expirationDate
                        ? new Date(entitlement.expirationDate)
                        : null

                    set({
                        isPremium,
                        subscriptionType,
                        expiresAt,
                    })

                    // Sync premium status to Firestore if user is logged in
                    const userId = get().currentUserId
                    if (userId) {
                        userService.updatePremiumStatus(
                            userId,
                            isPremium,
                            subscriptionType,
                            expiresAt
                        ).catch((err) => {
                            console.warn('[SubscriptionStore] Failed to sync premium to Firestore:', err)
                        })
                    }
                },
            },
        }),
        {
            name: 'subscription-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                isPremium: state.isPremium,
                subscriptionType: state.subscriptionType,
                expiresAt: state.expiresAt,
            }),
        }
    )
)

// Selector hooks for convenience
export const useIsPremium = () => useSubscriptionStore((s) => s.isPremium)
export const useSubscriptionActions = () => useSubscriptionStore((s) => s.actions)
