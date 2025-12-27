/**
 * useDailyBonusManager
 * Manages daily bonus tracking and streak protection checks
 */

import { useState, useEffect, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useProgressStore } from '@/store/progressStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { useCoinStore, COIN_REWARDS } from '@/store/coinStore'

const STORAGE_KEYS = {
    LAST_BONUS_DATE: '@daily_bonus_last_date',
    BONUS_DAY: '@daily_bonus_day',
    LAST_STREAK_CHECK: '@streak_last_check_date',
}

export function useDailyBonusManager() {
    const [showDailyBonus, setShowDailyBonus] = useState(false)
    const [showStreakProtection, setShowStreakProtection] = useState(false)
    const [currentBonusDay, setCurrentBonusDay] = useState(1)

    const isPremium = useSubscriptionStore((s) => s.isPremium)
    const { streak, lastReadDate } = useProgressStore((s) => s.stats)
    const coinActions = useCoinStore((s) => s.actions)

    // Check if daily bonus should be shown
    const checkDailyBonus = useCallback(async () => {
        try {
            const lastBonusDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_BONUS_DATE)
            const savedDay = await AsyncStorage.getItem(STORAGE_KEYS.BONUS_DAY)

            const today = new Date().toDateString()

            if (lastBonusDate !== today) {
                // New day - show bonus
                let day = savedDay ? parseInt(savedDay) + 1 : 1

                // Reset after day 7
                if (day > 7) day = 1

                // Check if streak was broken (more than 1 day gap)
                if (lastBonusDate) {
                    const lastDate = new Date(lastBonusDate)
                    const now = new Date()
                    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

                    // If more than 1 day gap, reset day count
                    if (daysDiff > 1) {
                        day = 1
                    }
                }

                setCurrentBonusDay(day)
                setShowDailyBonus(true)
            }
        } catch (e) {
            console.warn('[DailyBonus] Check failed:', e)
        }
    }, [])

    // Claim daily bonus
    const claimDailyBonus = useCallback(async () => {
        try {
            const today = new Date().toDateString()
            await AsyncStorage.setItem(STORAGE_KEYS.LAST_BONUS_DATE, today)
            await AsyncStorage.setItem(STORAGE_KEYS.BONUS_DAY, currentBonusDay.toString())

            // Premium users get bonus coins
            if (isPremium) {
                coinActions.earnCoins(COIN_REWARDS.DAILY_GOAL, 'PREMIUM_DAILY_BONUS')
            }

            setShowDailyBonus(false)
        } catch (e) {
            console.warn('[DailyBonus] Claim failed:', e)
        }
    }, [currentBonusDay, isPremium, coinActions])

    // Check streak protection need
    const checkStreakProtection = useCallback(async () => {
        if (isPremium) return // Premium has auto-protection
        if (streak <= 0) return // No streak to protect

        try {
            const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_STREAK_CHECK)
            const today = new Date().toDateString()

            if (lastCheck === today) return // Already checked today

            // Check if streak is at risk (no reading yesterday)
            if (lastReadDate) {
                const lastRead = new Date(lastReadDate)
                const now = new Date()
                const daysDiff = Math.floor((now.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24))

                // Streak at risk if last read was yesterday (or earlier)
                if (daysDiff >= 1) {
                    setShowStreakProtection(true)
                    await AsyncStorage.setItem(STORAGE_KEYS.LAST_STREAK_CHECK, today)
                }
            }
        } catch (e) {
            console.warn('[StreakProtection] Check failed:', e)
        }
    }, [streak, lastReadDate, isPremium])

    // Close modals
    const closeDailyBonus = useCallback(() => setShowDailyBonus(false), [])
    const closeStreakProtection = useCallback(() => setShowStreakProtection(false), [])
    const onStreakProtected = useCallback(() => {
        setShowStreakProtection(false)
        // The streak protector grant is handled in the modal
    }, [])

    // Run checks on mount
    useEffect(() => {
        const runChecks = async () => {
            await checkDailyBonus()
            await checkStreakProtection()
        }

        // Delay to let app fully initialize
        const timer = setTimeout(runChecks, 2000)
        return () => clearTimeout(timer)
    }, [checkDailyBonus, checkStreakProtection])

    return {
        // State
        showDailyBonus,
        showStreakProtection,
        currentBonusDay,
        currentStreak: streak,

        // Actions
        claimDailyBonus,
        closeDailyBonus,
        closeStreakProtection,
        onStreakProtected,
    }
}
