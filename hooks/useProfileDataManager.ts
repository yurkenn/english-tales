import { useState, useEffect } from 'react'
import { userService } from '@/services/userService'
import { communityService } from '@/services/communityService'
import { useAuthStore } from '@/store/authStore'
import { useSettingsStore } from '@/store/settingsStore'
import { UserProfile, CommunityPost } from '@/types'

export const useProfileDataManager = () => {
    const { user } = useAuthStore()
    const { actions: settingsActions } = useSettingsStore()

    const [fullProfile, setFullProfile] = useState<UserProfile | null>(null)
    const [myPosts, setMyPosts] = useState<CommunityPost[]>([])
    const [loadingProfile, setLoadingProfile] = useState(true)

    useEffect(() => {
        const loadInitialData = async () => {
            if (!user) return
            setLoadingProfile(true)

            const [profileRes, postsRes] = await Promise.all([
                userService.getUserProfile(user.id),
                communityService.getPostsByUser(user.id),
            ])

            if (profileRes.success) setFullProfile(profileRes.data)
            if (postsRes.success) setMyPosts(postsRes.data)

            setLoadingProfile(false)
        }
        loadInitialData()
        settingsActions.loadSettings()
    }, [user, settingsActions])

    return {
        fullProfile,
        myPosts,
        loadingProfile,
        user
    }
}
