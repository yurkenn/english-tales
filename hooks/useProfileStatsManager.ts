import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useProgressStore } from '@/store/progressStore'
import { useVocabularyStore } from '@/store/vocabularyStore'
import { useAchievementsStore } from '@/store/achievementsStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useThemeStore } from '@/store/themeStore'
import { CommunityPost, User } from '@/types'

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'tr', label: 'Türkçe' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'fr', label: 'Français' },
    { code: 'id', label: 'Indonesia' },
    { code: 'ja', label: '日本語' },
    { code: 'ko', label: '한국어' },
    { code: 'pt-BR', label: 'Português (Brasil)' },
]

export const useProfileStatsManager = (user: User | null, myPosts: CommunityPost[]) => {
    const { t } = useTranslation()
    const { progressMap, totalReadingTimeMs, actions: progressActions } = useProgressStore()
    const { savedWords } = useVocabularyStore()
    const { actions: achievementActions } = useAchievementsStore()
    const { settings } = useSettingsStore()
    const { mode: themeMode } = useThemeStore()

    const achievements = achievementActions.getAll()
    const unlockedCount = achievements.filter((a) => a.unlocked).length

    const stats = useMemo(() => {
        let booksRead = 0
        Object.values(progressMap).forEach((p) => { if (p.isCompleted) booksRead++ })
        const userWords = user?.id ? (savedWords[user.id] || {}) : {}
        const readingHours = Math.floor(totalReadingTimeMs / (1000 * 60 * 60))

        return {
            booksRead,
            streak: progressActions.getStreak(),
            postsCount: myPosts.length,
            vocabCount: Object.keys(userWords).length,
            readingHours,
        }
    }, [progressMap, myPosts, savedWords, user?.id, progressActions, totalReadingTimeMs])

    const themeModeLabel = themeMode === 'system'
        ? t('appearance.system')
        : themeMode === 'light'
            ? t('appearance.light')
            : t('appearance.dark')

    const currentLanguageLabel = LANGUAGES.find((l) => l.code === (settings.language || 'en'))?.label || 'English'

    return {
        stats,
        achievements,
        unlockedCount,
        themeModeLabel,
        currentLanguageLabel,
        settings,
        LANGUAGES
    }
}
