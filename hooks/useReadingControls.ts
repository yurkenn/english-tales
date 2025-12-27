/**
 * useReadingControls
 * Manages reading controls: font size, theme, bookmarks, and settings
 */

import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useReadingPrefsStore } from '@/store/readingPrefsStore'
import { useThemeStore } from '@/store/themeStore'
import { useLibraryStore } from '@/store/libraryStore'
import { useAuthStore } from '@/store/authStore'
import { useToastStore } from '@/store/toastStore'
import { haptics } from '@/utils/haptics'
import { type ReadingTheme } from '@/components'

interface StoryMeta {
    id: string
    title: string
    coverImage?: string
    author?: string
    description?: string
    estimatedReadTime?: number
    level?: string
}

interface UseReadingControlsOptions {
    storyId?: string
    storyMeta?: StoryMeta | null
}

export function useReadingControls({ storyId, storyMeta }: UseReadingControlsOptions) {
    const { t } = useTranslation()

    // Stores
    const { fontSize, lineHeight, fontFamily, theme: readingTheme, dyslexicFontEnabled, actions: prefsActions } = useReadingPrefsStore()
    const { isDark, highContrastEnabled } = useThemeStore()
    const { actions: libraryActions } = useLibraryStore()
    const isInLibrary = useLibraryStore((state) => storyId ? state.items.some((i) => i.storyId === storyId) : false)
    const { user } = useAuthStore()
    const toastActions = useToastStore((state) => state.actions)

    // Settings modal state
    const [showSettingsModal, setShowSettingsModal] = useState(false)

    // Font size handlers
    const handleFontDecrease = useCallback(() => {
        haptics.light()
        prefsActions.setFontSize(Math.max(14, fontSize - 2))
    }, [fontSize, prefsActions])

    const handleFontIncrease = useCallback(() => {
        haptics.light()
        prefsActions.setFontSize(Math.min(28, fontSize + 2))
    }, [fontSize, prefsActions])

    // Theme cycling
    const cycleReadingTheme = useCallback(() => {
        haptics.selection()
        const themes: ReadingTheme[] = ['light', 'dark', 'sepia']
        const currentIndex = themes.indexOf(readingTheme)
        const next = themes[(currentIndex + 1) % 3]
        prefsActions.setTheme(next)
        useThemeStore.getState().actions.setMode(next)
    }, [readingTheme, prefsActions])

    // Theme change from settings
    const handleThemeChange = useCallback((theme: ReadingTheme) => {
        prefsActions.setTheme(theme)
        useThemeStore.getState().actions.setMode(theme)
    }, [prefsActions])

    // Bookmark toggle
    const handleBookmarkToggle = useCallback(async () => {
        if (!storyMeta || !storyId) return

        if (!user || user.isAnonymous) {
            toastActions.warning(t('auth.guestBanner.title'))
            return
        }

        if (isInLibrary) {
            const result = await libraryActions.removeFromLibrary(storyId)
            if (result.success) {
                toastActions.info(t('library.menu.removeFromLibrary'))
            }
        } else {
            const result = await libraryActions.addToLibrary({
                id: storyId,
                title: storyMeta.title || 'Untitled',
                coverImage: storyMeta.coverImage || '',
                author: storyMeta.author || 'Unknown',
                description: storyMeta.description || '',
                estimatedReadTime: storyMeta.estimatedReadTime || 5,
                level: storyMeta.level || 'Beginner',
            } as any)

            if (result.success) {
                toastActions.success(t('profile.tabSaved'))
            }
        }
    }, [storyId, storyMeta, isInLibrary, libraryActions, user, toastActions, t])

    // Settings modal
    const openSettings = useCallback(() => setShowSettingsModal(true), [])
    const closeSettings = useCallback(() => setShowSettingsModal(false), [])

    return {
        // State
        fontSize,
        lineHeight,
        fontFamily,
        readingTheme,
        dyslexicFontEnabled,
        isDark,
        highContrastEnabled,
        isInLibrary,
        showSettingsModal,

        // Font actions
        handleFontDecrease,
        handleFontIncrease,

        // Theme actions
        cycleReadingTheme,
        handleThemeChange,

        // Library actions
        handleBookmarkToggle,

        // Settings modal
        openSettings,
        closeSettings,

        // Pref setters (pass-through for settings modal)
        setFontSize: prefsActions.setFontSize,
        setLineHeight: prefsActions.setLineHeight,
        setFontFamily: prefsActions.setFontFamily,
    }
}
