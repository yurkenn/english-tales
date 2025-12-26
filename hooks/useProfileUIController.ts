import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'expo-router'
import BottomSheet from '@gorhom/bottom-sheet'
import { useAuthStore } from '@/store/authStore'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { useThemeStore } from '@/store/themeStore'
import { haptics } from '@/utils/haptics'

export type TabType = 'posts' | 'saved' | 'about'

export const useProfileUIController = () => {
    const router = useRouter()
    const { signOut } = useAuthStore()
    const { actions: progressActions } = useProgressStore()
    const { actions: settingsActions } = useSettingsStore()
    const { actions: themeActions } = useThemeStore()

    const [activeTab, setActiveTab] = useState<TabType>('posts')
    const [showGuestBanner, setShowGuestBanner] = useState(true)

    const goalsSheetRef = useRef<BottomSheet>(null)
    const langSheetRef = useRef<BottomSheet>(null)

    const handleSettingsPress = useCallback(() => {
        haptics.selection()
        router.push('/settings')
    }, [router])

    const handleEditPress = useCallback(() => {
        haptics.selection()
        router.push('/user/edit')
    }, [router])

    const handleTabChange = useCallback((tab: TabType) => {
        haptics.selection()
        setActiveTab(tab)
    }, [])

    const handleSignOut = useCallback(() => {
        haptics.warning()
        signOut()
    }, [signOut])

    const handleFollowersPress = useCallback(() => {
        haptics.selection()
        router.push('/social' as any)
    }, [router])

    return {
        activeTab,
        showGuestBanner,
        setShowGuestBanner,
        goalsSheetRef,
        langSheetRef,
        handleSettingsPress,
        handleEditPress,
        handleTabChange,
        handleSignOut,
        handleFollowersPress,
        themeActions,
        settingsActions,
        progressActions,
        router
    }
}
