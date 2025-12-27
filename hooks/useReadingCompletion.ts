/**
 * useReadingCompletion
 * Manages story completion, review submission, and quiz flow
 */

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'expo-router'
import BottomSheet from '@gorhom/bottom-sheet'
import { useProgressStore } from '@/store/progressStore'
import { useAuthStore } from '@/store/authStore'
import { analyticsService } from '@/services/firebase/analytics'
import { haptics } from '@/utils/haptics'

interface UseReadingCompletionOptions {
    storyId?: string
    storyTitle?: string
    wordCount?: number
    hasQuiz?: boolean
    quizLength?: number
}

export function useReadingCompletion({
    storyId,
    storyTitle,
    wordCount = 0,
    hasQuiz = false,
    quizLength = 0,
}: UseReadingCompletionOptions) {
    const router = useRouter()
    const progressActions = useProgressStore((s) => s.actions)

    const [showCompletionModal, setShowCompletionModal] = useState(false)
    const [showQuizModal, setShowQuizModal] = useState(false)
    const [completionRating, setCompletionRating] = useState(0)

    const reviewSheetRef = useRef<BottomSheet>(null)
    const hasShownCompletion = useRef(false)
    const startTimeRef = useRef<number>(Date.now())

    // Reset timer on mount
    const resetTimer = useCallback(() => {
        startTimeRef.current = Date.now()
    }, [])

    // Get elapsed reading time in minutes
    const getReadingTimeMinutes = useCallback(() => {
        return Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))
    }, [])

    // Trigger completion modal (Kindle-style: on last page next tap)
    const triggerCompletion = useCallback(() => {
        if (!hasShownCompletion.current) {
            hasShownCompletion.current = true
            haptics.success()
            setShowCompletionModal(true)
        }
    }, [])

    // Mark story as complete
    const handleMarkComplete = useCallback(async (rating?: number) => {
        haptics.success()
        const readingTime = getReadingTimeMinutes()

        if (storyId) {
            analyticsService.logEvent('story_completed', {
                story_id: storyId,
                story_title: storyTitle,
                rating,
                reading_time: readingTime,
                word_count: wordCount,
            })

            await progressActions.markComplete(storyId, storyTitle, {
                rating,
                readingTime,
                wordCount,
            })
        }

        setShowCompletionModal(false)

        if (rating) {
            setCompletionRating(rating)
            setTimeout(() => {
                reviewSheetRef.current?.expand()
            }, 500)
        } else {
            router.push('/(tabs)/discover')
        }
    }, [storyId, storyTitle, wordCount, progressActions, router, getReadingTimeMinutes])

    // Handle continuing without completion
    const handleContinueHome = useCallback(() => {
        setShowCompletionModal(false)
        router.replace('/(tabs)')
    }, [router])

    // Handle review submission
    const handleReviewSubmit = useCallback(async (rating: number, text: string) => {
        const { user } = useAuthStore.getState()
        if (!user || !storyId) return

        const { reviewService } = await import('@/services/reviewService')
        await reviewService.addReview(
            storyId,
            storyTitle || '',
            user.id,
            user.displayName || 'Anonymous',
            user.photoURL,
            rating,
            text
        )

        if (hasQuiz && quizLength > 0) {
            setShowQuizModal(true)
        } else {
            router.back()
        }
    }, [storyId, storyTitle, hasQuiz, quizLength, router])

    // Handle quiz close
    const handleQuizClose = useCallback(async (accuracy: number) => {
        if (storyId && quizLength > 0) {
            const score = Math.round((accuracy / 100) * quizLength)
            await progressActions.saveQuizResult(storyId, score, quizLength)
        }
        setShowQuizModal(false)
        router.back()
    }, [storyId, quizLength, progressActions, router])

    // Sync reading time on unmount
    const syncReadingTime = useCallback(() => {
        const elapsed = Date.now() - startTimeRef.current
        if (storyId && elapsed > 2000) {
            progressActions.incrementReadingTime(storyId, elapsed)
        }
    }, [storyId, progressActions])

    return {
        // State
        showCompletionModal,
        showQuizModal,
        completionRating,
        reviewSheetRef,

        // Derived
        readingTimeMinutes: getReadingTimeMinutes(),

        // Actions
        triggerCompletion,
        handleMarkComplete,
        handleContinueHome,
        handleReviewSubmit,
        handleQuizClose,
        resetTimer,
        syncReadingTime,

        // Close helpers
        closeReviewSheet: () => reviewSheetRef.current?.close(),
    }
}
