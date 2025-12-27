import { useState, useRef, useCallback } from 'react'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { dictionaryService, DictionaryEntry } from '@/services/dictionary'
import { analyticsService } from '@/services/firebase/analytics'
import { useRewardStore } from '@/store/rewardStore'
import { useAuthStore } from '@/store/authStore'
import { useSubscriptionStore } from '@/store/subscriptionStore'
import { haptics } from '@/utils/haptics'

interface UseDictionaryManagementProps {
    storyId: string | undefined
}

export function useDictionaryManagement({ storyId }: UseDictionaryManagementProps) {
    const wordSheetRef = useRef<BottomSheetModal>(null)
    const [selectedWord, setSelectedWord] = useState('')
    const [dictionaryData, setDictionaryData] = useState<DictionaryEntry | null>(null)
    const [isWordLoading, setIsWordLoading] = useState(false)
    const [showTranslationLimitModal, setShowTranslationLimitModal] = useState(false)
    const [pendingWord, setPendingWord] = useState<string | null>(null)

    const rewardActions = useRewardStore((state) => state.actions)
    const remainingTranslations = useRewardStore((state) => state.actions.getRemainingTranslations())

    const performLookup = useCallback(async (word: string) => {
        setSelectedWord(word)
        setIsWordLoading(true)
        wordSheetRef.current?.present()

        const data = await dictionaryService.lookup(word)
        setDictionaryData(data)
        setIsWordLoading(false)

        analyticsService.logEvent('word_lookup', {
            word,
            story_id: storyId
        })
    }, [storyId])

    const handleWordPress = useCallback(async (word: string) => {
        const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim()
        if (!cleaned) return

        haptics.light()

        // Check if user is premium (skip limit for premium users)
        // Check both user field and RevenueCat subscription store
        const user = useAuthStore.getState().user
        const subscriptionState = useSubscriptionStore.getState()
        const isPremium = user?.isPremium || subscriptionState.isPremium

        if (isPremium) {
            // Premium users have unlimited translations
            await performLookup(cleaned)
            return
        }

        // Check translation limit for free users
        if (!rewardActions.canTranslate()) {
            // Show limit modal and save the word for later
            setPendingWord(cleaned)
            setShowTranslationLimitModal(true)

            analyticsService.logEvent('translation_limit_reached', {
                story_id: storyId
            })
            return
        }

        // Use one translation credit
        rewardActions.useTranslation()
        await performLookup(cleaned)
    }, [storyId, rewardActions, performLookup])

    const handleTranslationRewardEarned = useCallback(() => {
        setShowTranslationLimitModal(false)

        // If there was a pending word, look it up now
        if (pendingWord) {
            rewardActions.useTranslation()
            performLookup(pendingWord)
            setPendingWord(null)
        }
    }, [pendingWord, rewardActions, performLookup])

    const closeTranslationLimitModal = useCallback(() => {
        setShowTranslationLimitModal(false)
        setPendingWord(null)
    }, [])

    return {
        wordSheetRef,
        selectedWord,
        dictionaryData,
        isWordLoading,
        handleWordPress,
        // Translation limit
        showTranslationLimitModal,
        closeTranslationLimitModal,
        handleTranslationRewardEarned,
        remainingTranslations,
    }
}
