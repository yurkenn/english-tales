import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react'
import { View, Pressable, ActivityIndicator, RefreshControl, Image, ImageSourcePropType } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Typography } from '../atoms'
import { StoryGridCard } from '../molecules/StoryGridCard'
import { CommunityPostCard } from './CommunityPostCard'
import { ProfileTabs, ProfileTabType } from '../molecules/ProfileTabs'
import { UserProfile, CommunityPost, LibraryItem } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { socialService } from '@/services/socialService'
import { userService } from '@/services/userService'
import { communityService } from '@/services/communityService'
import { useToastStore } from '@/store/toastStore'
import { haptics } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'
import Animated, { FadeInDown } from 'react-native-reanimated'

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png')

interface UserProfileSheetProps {
    userId: string
    onClose: () => void
}

interface ProfileStats {
    followers: number
    following: number
    streak: number
}

// Empty state component for reusability
const EmptyState = ({ icon, message }: { icon: keyof typeof Ionicons.glyphMap; message: string }) => {
    const { theme } = useUnistyles()
    return (
        <View style={styles.emptyContainer}>
            <Ionicons name={icon} size={48} color={theme.colors.border} />
            <Typography color={theme.colors.textMuted} style={styles.emptyText}>
                {message}
            </Typography>
        </View>
    )
}

// Profile avatar with fallback
const ProfileAvatar = ({ photoURL }: { photoURL?: string | null }) => {
    const source: ImageSourcePropType = photoURL ? { uri: photoURL } : DEFAULT_AVATAR
    return <Image source={source} style={styles.avatar} />
}

// Stats row component
const StatsRow = ({ stats, t }: { stats: ProfileStats; t: any }) => {
    const { theme } = useUnistyles()

    const statItems = [
        { value: stats.followers, label: t('profile.followers', 'Followers') },
        { value: stats.following, label: t('profile.following', 'Following') },
        { value: stats.streak, label: t('profile.streak', 'Streak') },
    ]

    return (
        <View style={styles.statsRow}>
            {statItems.map((item, index) => (
                <React.Fragment key={item.label}>
                    {index > 0 && <View style={styles.statDivider} />}
                    <View style={styles.statItem}>
                        <Typography variant="h3">{item.value}</Typography>
                        <Typography variant="caption" color={theme.colors.textMuted}>
                            {item.label}
                        </Typography>
                    </View>
                </React.Fragment>
            ))}
        </View>
    )
}

// Follow button component
const FollowButton = ({
    isFollowing,
    loading,
    onPress,
    t
}: {
    isFollowing: boolean
    loading: boolean
    onPress: () => void
    t: any
}) => {
    const { theme } = useUnistyles()

    return (
        <Pressable
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={onPress}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator color={isFollowing ? theme.colors.primary : '#FFFFFF'} />
            ) : (
                <>
                    <Ionicons
                        name={isFollowing ? 'checkmark' : 'person-add-outline'}
                        size={18}
                        color={isFollowing ? theme.colors.primary : '#FFFFFF'}
                    />
                    <Typography
                        variant="bodyBold"
                        color={isFollowing ? theme.colors.primary : '#FFFFFF'}
                    >
                        {isFollowing ? t('social.following', 'Following') : t('social.follow', 'Follow')}
                    </Typography>
                </>
            )}
        </Pressable>
    )
}

export const UserProfileSheet = forwardRef<BottomSheetModal, UserProfileSheetProps>(
    ({ userId, onClose }, ref) => {
        const { t } = useTranslation()
        const { theme } = useUnistyles()
        const router = useRouter()
        const { user: currentUser } = useAuthStore()
        const toast = useToastStore(s => s.actions)

        // State
        const [profile, setProfile] = useState<UserProfile | null>(null)
        const [posts, setPosts] = useState<CommunityPost[]>([])
        const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
        const [activeTab, setActiveTab] = useState<ProfileTabType>('posts')
        const [loading, setLoading] = useState(true)
        const [refreshing, setRefreshing] = useState(false)
        const [isFollowing, setIsFollowing] = useState(false)
        const [actionLoading, setActionLoading] = useState(false)
        const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, streak: 0 })

        // Memoized values
        const snapPoints = useMemo(() => ['95%'], [])
        const isSelf = currentUser?.id === profile?.id

        // Common sheet props
        const sheetProps = useMemo(() => ({
            snapPoints,
            enablePanDownToClose: true,
            backgroundStyle: { backgroundColor: theme.colors.background },
            handleIndicatorStyle: { backgroundColor: theme.colors.textMuted, width: 40 },
            onDismiss: onClose,
        }), [snapPoints, theme.colors.background, theme.colors.textMuted, onClose])

        const renderBackdrop = useCallback(
            (props: any) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.6}
                    pressBehavior="close"
                />
            ),
            []
        )

        // Data fetching
        const loadData = useCallback(async () => {
            if (!userId) return

            try {
                const [profileRes, postsRes, followersCount, followingCount] = await Promise.all([
                    userService.getUserProfile(userId),
                    communityService.getPostsByUser(userId),
                    socialService.getFollowersCount(userId),
                    socialService.getFollowingCount(userId),
                ])

                if (profileRes.success && profileRes.data) {
                    setProfile(profileRes.data)
                }
                if (postsRes.success) {
                    setPosts(postsRes.data)
                }
                setStats(prev => ({ ...prev, followers: followersCount, following: followingCount }))

                if (currentUser) {
                    const followRes = await socialService.isFollowing(currentUser.id, userId)
                    if (followRes.success) {
                        setIsFollowing(followRes.data)
                    }
                }
            } catch (error) {
                console.error('Failed to load profile:', error)
            } finally {
                setLoading(false)
                setRefreshing(false)
            }
        }, [userId, currentUser])

        useEffect(() => {
            loadData()
        }, [loadData])

        const handleRefresh = useCallback(() => {
            setRefreshing(true)
            loadData()
        }, [loadData])

        const handleFollowPress = useCallback(async () => {
            if (!currentUser || !profile || isSelf) return

            setActionLoading(true)
            haptics.selection()

            try {
                if (isFollowing) {
                    const result = await socialService.unfollowUser(currentUser.id, profile.id)
                    if (result.success) {
                        setIsFollowing(false)
                        setStats(prev => ({ ...prev, followers: prev.followers - 1 }))
                        toast.success(t('social.unfollowed', 'Unfollowed'))
                    }
                } else {
                    const result = await socialService.followUser(
                        currentUser.id,
                        currentUser.displayName || 'Anonymous',
                        currentUser.photoURL,
                        profile.id
                    )
                    if (result.success) {
                        setIsFollowing(true)
                        setStats(prev => ({ ...prev, followers: prev.followers + 1 }))
                        haptics.success()
                        toast.success(t('social.following', 'Following'))
                    }
                }
            } finally {
                setActionLoading(false)
            }
        }, [currentUser, profile, isSelf, isFollowing, toast, t])

        // Tab content renderer
        const renderTabContent = useCallback(() => {
            if (activeTab === 'posts') {
                if (posts.length === 0) {
                    return <EmptyState icon="chatbubble-ellipses-outline" message={t('profile.noPosts', 'No posts yet')} />
                }
                return (
                    <View style={styles.tabContent}>
                        {posts.map((post, index) => (
                            <Animated.View key={post.id} entering={FadeInDown.delay(index * 50).duration(300)}>
                                <CommunityPostCard
                                    post={post}
                                    currentUserId={currentUser?.id || ''}
                                    onLike={() => { }}
                                    onReply={() => { }}
                                />
                            </Animated.View>
                        ))}
                    </View>
                )
            }

            if (activeTab === 'library') {
                if (libraryItems.length === 0) {
                    return <EmptyState icon="library-outline" message={t('profile.privateLibrary', 'Library is private')} />
                }
                return (
                    <View style={[styles.tabContent, styles.grid]}>
                        {libraryItems.map((item) => (
                            <StoryGridCard
                                key={item.storyId}
                                story={item.story}
                                isInLibrary={false}
                                onPress={() => {
                                    onClose()
                                    router.push(`/story/${item.storyId}`)
                                }}
                            />
                        ))}
                    </View>
                )
            }

            return null
        }, [activeTab, posts, libraryItems, currentUser?.id, onClose, router, t])

        // Loading state
        if (loading) {
            return (
                <BottomSheetModal ref={ref} {...sheetProps} backdropComponent={renderBackdrop}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                </BottomSheetModal>
            )
        }

        // Error state
        if (!profile) {
            return (
                <BottomSheetModal ref={ref} {...sheetProps} backdropComponent={renderBackdrop}>
                    <View style={styles.loadingContainer}>
                        <Typography color={theme.colors.textMuted}>
                            {t('social.userNotFound', 'User not found')}
                        </Typography>
                    </View>
                </BottomSheetModal>
            )
        }

        return (
            <BottomSheetModal ref={ref} {...sheetProps} backdropComponent={renderBackdrop}>
                <BottomSheetScrollView
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerSpacer} />
                        <Typography variant="bodyBold" style={styles.headerTitle}>
                            {t('profile.title', 'Profile')}
                        </Typography>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    {/* Profile Section */}
                    <View style={styles.profileSection}>
                        <View style={styles.avatarContainer}>
                            <ProfileAvatar photoURL={profile.photoURL} />
                        </View>

                        <Typography variant="h2" style={styles.displayName}>
                            {profile.displayName || 'Anonymous'}
                        </Typography>

                        {profile.bio && (
                            <Typography color={theme.colors.textSecondary} style={styles.bio}>
                                {profile.bio}
                            </Typography>
                        )}

                        <StatsRow stats={stats} t={t} />

                        {!isSelf && (
                            <FollowButton
                                isFollowing={isFollowing}
                                loading={actionLoading}
                                onPress={handleFollowPress}
                                t={t}
                            />
                        )}
                    </View>

                    {/* Tabs */}
                    <ProfileTabs
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        counts={{ posts: posts.length, library: libraryItems.length }}
                    />

                    {/* Tab Content */}
                    {renderTabContent()}
                </BottomSheetScrollView>
            </BottomSheetModal>
        )
    }
)

const styles = StyleSheet.create((theme) => ({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    headerSpacer: {
        width: 40,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        backgroundColor: theme.colors.borderLight,
    },
    profileSection: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.lg,
    },
    avatarContainer: {
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: theme.colors.borderLight,
    },
    displayName: {
        fontWeight: '800',
        marginBottom: 4,
    },
    bio: {
        textAlign: 'center',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.xl,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.border,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: theme.colors.primary,
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 12,
        ...theme.shadows.sm,
    },
    followingButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    tabContent: {
        paddingBottom: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
        gap: theme.spacing.md,
    },
    emptyText: {
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
    },
}))
