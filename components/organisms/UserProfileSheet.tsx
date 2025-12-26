import React, { forwardRef, useCallback, useMemo, useState, useEffect } from 'react'
import { View, Pressable, ActivityIndicator, RefreshControl, Image, ImageSourcePropType } from 'react-native'
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Typography, ProfileTabButton, ProfileStatItem } from '../atoms'
import { StoryGridCard } from '../molecules/StoryGridCard'
import { CommunityPostCard } from './CommunityPostCard'
import { EmptyState } from '../molecules/EmptyState'
import { UserProfile, CommunityPost, LibraryItem } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { socialService } from '@/services/socialService'
import { userService } from '@/services/userService'
import { communityService } from '@/services/communityService'
import { useToastStore } from '@/store/toastStore'
import { haptics } from '@/utils/haptics'
import { useTranslation } from 'react-i18next'

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

// Tab Types
type TabType = 'posts' | 'saved' | 'about'

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
        const [activeTab, setActiveTab] = useState<TabType>('posts')
        const [loading, setLoading] = useState(true)
        const [refreshing, setRefreshing] = useState(false)
        const [isFollowing, setIsFollowing] = useState(false)
        const [actionLoading, setActionLoading] = useState(false)
        const [stats, setStats] = useState<ProfileStats>({ followers: 0, following: 0, streak: 0 })

        // Memoized values
        const snapPoints = useMemo(() => ['95%'], [])
        const isSelf = currentUser?.id === profile?.id

        // Sheet props
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

        const handleViewFullProfile = useCallback(() => {
            onClose()
            router.push(`/user/${userId}`)
        }, [onClose, router, userId])

        const handleTabChange = useCallback((tab: TabType) => {
            haptics.selection()
            setActiveTab(tab)
        }, [])

        // Tab content renderer
        const renderTabContent = useCallback(() => {
            switch (activeTab) {
                case 'posts':
                    return posts.length === 0 ? (
                        <EmptyState
                            icon="chatbubble-ellipses-outline"
                            title={t('profile.noPosts', 'No posts yet')}
                            message={t('profile.noUserPosts', 'This user hasn\'t shared anything yet.')}
                        />
                    ) : (
                        <View style={styles.feedContainer}>
                            {posts.map((post) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={currentUser?.id || ''}
                                    onLike={() => { }}
                                    onReply={() => { }}
                                />
                            ))}
                        </View>
                    )

                case 'saved':
                    return libraryItems.length === 0 ? (
                        <EmptyState
                            icon="bookmark-outline"
                            title={t('profile.emptyLibrary', 'Nothing saved')}
                            message={t('profile.privateLibrary', 'This library is private or empty.')}
                        />
                    ) : (
                        <View style={styles.savedGrid}>
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

                case 'about':
                    return (
                        <View style={styles.aboutContainer}>
                            {/* Quick Stats */}
                            <View style={styles.quickStatsCard}>
                                <View style={styles.quickStatsRow}>
                                    <View style={styles.quickStatItem}>
                                        <Ionicons name="book" size={20} color={theme.colors.primary} />
                                        <Typography style={styles.quickStatValue}>{libraryItems.length}</Typography>
                                        <Typography style={styles.quickStatLabel}>{t('profile.books', 'Books')}</Typography>
                                    </View>
                                    <View style={styles.quickStatDivider} />
                                    <View style={styles.quickStatItem}>
                                        <Ionicons name="chatbubble" size={20} color="#F59E0B" />
                                        <Typography style={styles.quickStatValue}>{posts.length}</Typography>
                                        <Typography style={styles.quickStatLabel}>{t('profile.posts', 'Posts')}</Typography>
                                    </View>
                                    <View style={styles.quickStatDivider} />
                                    <View style={styles.quickStatItem}>
                                        <Ionicons name="flame" size={20} color="#EF4444" />
                                        <Typography style={styles.quickStatValue}>{stats.streak}</Typography>
                                        <Typography style={styles.quickStatLabel}>{t('profile.streak', 'Streak')}</Typography>
                                    </View>
                                </View>
                            </View>

                            {/* Bio */}
                            {profile?.bio && (
                                <View style={styles.bioSection}>
                                    <Typography style={styles.sectionTitle}>{t('profile.about', 'About')}</Typography>
                                    <View style={styles.bioCard}>
                                        <Typography style={styles.bioText}>{profile.bio}</Typography>
                                    </View>
                                </View>
                            )}

                            {/* View Full Profile */}
                            <Pressable style={styles.viewFullButton} onPress={handleViewFullProfile}>
                                <Ionicons name="expand-outline" size={18} color={theme.colors.primary} />
                                <Typography style={[styles.viewFullText, { color: theme.colors.primary }]}>
                                    {t('profile.viewFull', 'View Full Profile')}
                                </Typography>
                            </Pressable>
                        </View>
                    )

                default:
                    return null
            }
        }, [activeTab, posts, libraryItems, stats, profile, currentUser?.id, onClose, router, theme.colors, t, handleViewFullProfile])

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
                        <Ionicons name="person-outline" size={48} color={theme.colors.textMuted} />
                        <Typography color={theme.colors.textMuted} style={styles.notFoundText}>
                            {t('social.userNotFound', 'User not found')}
                        </Typography>
                    </View>
                </BottomSheetModal>
            )
        }

        const avatarSource: ImageSourcePropType = profile.photoURL ? { uri: profile.photoURL } : DEFAULT_AVATAR

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
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerSpacer} />
                        <Typography style={styles.headerTitle}>
                            {t('profile.title', 'Profile')}
                        </Typography>
                        <Pressable onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={22} color={theme.colors.text} />
                        </Pressable>
                    </View>

                    {/* Profile Card */}
                    <View style={styles.profileCard}>
                        {/* Avatar Row */}
                        <View style={styles.avatarRow}>
                            <Image source={avatarSource} style={styles.avatar} />
                            <View style={styles.statsRow}>
                                <ProfileStatItem
                                    value={stats.followers}
                                    label={t('social.followers', 'Followers')}
                                />
                                <ProfileStatItem
                                    value={stats.following}
                                    label={t('social.following', 'Following')}
                                />
                                <ProfileStatItem
                                    value={stats.streak}
                                    label={t('profile.streak', 'Streak')}
                                />
                            </View>
                        </View>

                        {/* User Info */}
                        <View style={styles.userInfo}>
                            <Typography style={styles.displayName}>
                                {profile.displayName || 'Reader'}
                            </Typography>
                            <Typography style={styles.username}>
                                @{profile.displayName?.toLowerCase().replace(/\s+/g, '_') || 'reader'}
                            </Typography>

                            {/* Bio Preview */}
                            {profile.bio && (
                                <Typography style={styles.bioPreview} numberOfLines={2}>
                                    {profile.bio}
                                </Typography>
                            )}

                            {/* Follow Button */}
                            {!isSelf && (
                                <Pressable
                                    style={[
                                        styles.followButton,
                                        isFollowing && styles.followingButton,
                                        { borderColor: theme.colors.border }
                                    ]}
                                    onPress={handleFollowPress}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? (
                                        <ActivityIndicator size="small" color={isFollowing ? theme.colors.text : '#FFFFFF'} />
                                    ) : (
                                        <>
                                            <Ionicons
                                                name={isFollowing ? 'checkmark' : 'person-add-outline'}
                                                size={16}
                                                color={isFollowing ? theme.colors.text : '#FFFFFF'}
                                            />
                                            <Typography
                                                style={[
                                                    styles.followButtonText,
                                                    { color: isFollowing ? theme.colors.text : '#FFFFFF' }
                                                ]}
                                            >
                                                {isFollowing
                                                    ? t('social.following', 'Following')
                                                    : t('social.follow', 'Follow')
                                                }
                                            </Typography>
                                        </>
                                    )}
                                </Pressable>
                            )}
                        </View>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <ProfileTabButton
                            label={t('profile.tabPosts', 'Posts')}
                            count={posts.length}
                            isActive={activeTab === 'posts'}
                            onPress={() => handleTabChange('posts')}
                        />
                        <ProfileTabButton
                            label={t('profile.tabSaved', 'Saved')}
                            count={libraryItems.length}
                            isActive={activeTab === 'saved'}
                            onPress={() => handleTabChange('saved')}
                        />
                        <ProfileTabButton
                            label={t('profile.tabAbout', 'About')}
                            isActive={activeTab === 'about'}
                            onPress={() => handleTabChange('about')}
                        />
                    </View>

                    {/* Tab Content */}
                    <View style={styles.tabContent}>
                        {renderTabContent()}
                    </View>
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
        gap: 16,
    },
    notFoundText: {
        fontSize: theme.typography.size.md,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    headerSpacer: {
        width: 40,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: '600',
        color: theme.colors.text,
    },
    closeButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },

    // Profile Card
    profileCard: {
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        padding: 20,
        ...theme.shadows.md,
    },
    avatarRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    avatar: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: theme.colors.borderLight,
    },
    statsRow: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 16,
        paddingTop: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statItemValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    statItemLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    userInfo: {
        marginTop: 16,
    },
    displayName: {
        fontSize: theme.typography.size.xl,
        fontWeight: '700',
        color: theme.colors.text,
    },
    username: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    bioPreview: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginTop: 12,
        lineHeight: 20,
    },
    followButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: theme.colors.primary,
    },
    followingButton: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
    },
    followButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
    },

    // Tabs
    tabsContainer: {
        flexDirection: 'row',
        marginTop: 20,
        marginHorizontal: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 4,
    },
    tabButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        position: 'relative',
    },
    tabButtonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tabButtonText: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
    },
    tabButtonTextActive: {
        fontWeight: '700',
    },
    tabBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
    },
    tabBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    tabIndicator: {
        position: 'absolute',
        bottom: 2,
        width: 24,
        height: 3,
        borderRadius: 2,
    },

    // Tab Content
    tabContent: {
        minHeight: 300,
    },
    feedContainer: {
        padding: 16,
        gap: 16,
    },
    savedGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        gap: 12,
    },

    // About Tab
    aboutContainer: {
        padding: 16,
    },
    quickStatsCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        ...theme.shadows.sm,
    },
    quickStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    quickStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    quickStatDivider: {
        width: 1,
        backgroundColor: theme.colors.borderLight,
        marginVertical: 4,
    },
    quickStatValue: {
        fontSize: theme.typography.size.lg,
        fontWeight: '700',
        color: theme.colors.text,
        marginTop: 8,
    },
    quickStatLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: 2,
    },
    bioSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: theme.typography.size.xs,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    bioCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        ...theme.shadows.sm,
    },
    bioText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
        lineHeight: 22,
    },
    viewFullButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    viewFullText: {
        fontSize: theme.typography.size.md,
        fontWeight: '600',
    },
}))
