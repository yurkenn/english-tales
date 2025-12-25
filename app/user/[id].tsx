import React, { useState, useMemo, useCallback } from 'react'
import { View, Pressable, ScrollView, Image, RefreshControl } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'

import { Typography } from '@/components/atoms'
import { CommunityPostCard } from '@/components/organisms/CommunityPostCard'
import { StoryGridCard } from '@/components/molecules/StoryGridCard'
import { EmptyState } from '@/components/molecules/EmptyState'
import { ReviewCard } from '@/components/molecules/ReviewCard'
import { ProfileScreenSkeleton } from '@/components/skeletons/ProfileScreenSkeleton'

import { useUserProfile } from '@/hooks/useUserProfile'
import { haptics } from '@/utils/haptics'
import { useAuthStore } from '@/store/authStore'

const DEFAULT_AVATAR = require('@/assets/defaultavatar.png')

// Tab Types (matching profile.tsx)
type TabType = 'posts' | 'saved' | 'about'

// Tab Button Component
const TabButton = ({
    label,
    count,
    isActive,
    onPress
}: {
    label: string
    count?: number
    isActive: boolean
    onPress: () => void
}) => {
    const { theme } = useUnistyles()
    return (
        <Pressable style={styles.tabButton} onPress={onPress}>
            <View style={styles.tabButtonContent}>
                <Typography
                    style={[
                        styles.tabButtonText,
                        { color: isActive ? theme.colors.text : theme.colors.textMuted },
                        isActive && styles.tabButtonTextActive
                    ]}
                >
                    {label}
                </Typography>
                {count !== undefined && count > 0 && (
                    <View style={[
                        styles.tabBadge,
                        { backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceElevated }
                    ]}>
                        <Typography
                            style={[
                                styles.tabBadgeText,
                                { color: isActive ? '#FFFFFF' : theme.colors.textMuted }
                            ]}
                        >
                            {count > 99 ? '99+' : count}
                        </Typography>
                    </View>
                )}
            </View>
            {isActive && (
                <View style={[styles.tabIndicator, { backgroundColor: theme.colors.primary }]} />
            )}
        </Pressable>
    )
}

// Stat Item Component
const StatItem = ({ value, label, onPress }: { value: string | number; label: string; onPress?: () => void }) => {
    const { theme } = useUnistyles()
    const content = (
        <View style={styles.statItem}>
            <Typography style={styles.statItemValue}>{value}</Typography>
            <Typography style={styles.statItemLabel}>{label}</Typography>
        </View>
    )
    return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content
}

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>()
    const { t } = useTranslation()
    const { theme } = useUnistyles()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { user: currentUser } = useAuthStore()

    const {
        profile,
        posts,
        reviews,
        stats,
        relationship,
        loading,
        actionLoading,
        refresh,
        handleFollow,
        handleUnfollow,
        libraryItems,
    } = useUserProfile(id!)

    const [activeTab, setActiveTab] = useState<TabType>('posts')
    const [refreshing, setRefreshing] = useState(false)

    // Handlers
    const handleBack = useCallback(() => {
        haptics.selection()
        router.back()
    }, [router])

    const handleFollowPress = useCallback(() => {
        haptics.selection()
        if (relationship === 'following') {
            handleUnfollow()
        } else {
            handleFollow()
        }
    }, [relationship, handleFollow, handleUnfollow])

    const handleTabChange = useCallback((tab: TabType) => {
        haptics.selection()
        setActiveTab(tab)
    }, [])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await refresh()
        setRefreshing(false)
    }, [refresh])

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
                                currentUserId={currentUser?.id}
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
                                onPress={() => router.push(`/story/${item.storyId}`)}
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
                                    <Ionicons name="star" size={20} color="#10B981" />
                                    <Typography style={styles.quickStatValue}>{reviews.length}</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.reviews', 'Reviews')}</Typography>
                                </View>
                                <View style={styles.quickStatDivider} />
                                <View style={styles.quickStatItem}>
                                    <Ionicons name="flame" size={20} color="#EF4444" />
                                    <Typography style={styles.quickStatValue}>{stats.streak}</Typography>
                                    <Typography style={styles.quickStatLabel}>{t('profile.streak', 'Streak')}</Typography>
                                </View>
                            </View>
                        </View>

                        {/* Reviews Section */}
                        {reviews.length > 0 && (
                            <View style={styles.reviewsSection}>
                                <Typography style={styles.sectionTitle}>{t('profile.recentReviews', 'Recent Reviews')}</Typography>
                                {reviews.slice(0, 3).map((review) => (
                                    <View key={review.id} style={styles.reviewItem}>
                                        <ReviewCard
                                            userName={review.userName}
                                            userAvatar={review.userPhoto}
                                            rating={review.rating}
                                            text={review.comment}
                                        />
                                        <View style={styles.reviewStoryTag}>
                                            <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                                            <Typography style={styles.reviewStoryName}>
                                                {review.storyTitle || 'Story'}
                                            </Typography>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* Bio Section */}
                        {profile?.bio && (
                            <View style={styles.bioSection}>
                                <Typography style={styles.sectionTitle}>{t('profile.about', 'About')}</Typography>
                                <View style={styles.bioCard}>
                                    <Typography style={styles.bioText}>{profile.bio}</Typography>
                                </View>
                            </View>
                        )}
                    </View>
                )

            default:
                return null
        }
    }, [activeTab, posts, libraryItems, reviews, stats, profile, currentUser?.id, router, theme.colors, t])

    // Loading state
    if (loading && !profile) {
        return <ProfileScreenSkeleton />
    }

    // Not found state
    if (!profile) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
                <Typography style={styles.notFoundText}>{t('social.userNotFound', 'User not found')}</Typography>
                <Pressable style={styles.goBackButton} onPress={handleBack}>
                    <Typography color={theme.colors.primary}>{t('common.goBack', 'Go Back')}</Typography>
                </Pressable>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Typography style={styles.headerTitle} numberOfLines={1}>
                    {profile.displayName || t('profile.title', 'Profile')}
                </Typography>
                <View style={styles.headerSpacer} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
                }
            >
                {/* Profile Card */}
                <View style={styles.profileCard}>
                    {/* Avatar Row */}
                    <View style={styles.avatarRow}>
                        <Image
                            source={profile.photoURL ? { uri: profile.photoURL } : DEFAULT_AVATAR}
                            style={styles.avatar}
                        />
                        <View style={styles.statsRow}>
                            <StatItem
                                value={stats.followers}
                                label={t('social.followers', 'Followers')}
                            />
                            <StatItem
                                value={stats.following}
                                label={t('social.following', 'Following')}
                            />
                            <StatItem
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
                        <Pressable
                            style={[
                                styles.followButton,
                                relationship === 'following' && styles.followingButton,
                                { borderColor: theme.colors.border }
                            ]}
                            onPress={handleFollowPress}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Typography style={styles.followButtonText}>...</Typography>
                            ) : (
                                <>
                                    <Ionicons
                                        name={relationship === 'following' ? 'checkmark' : 'person-add-outline'}
                                        size={16}
                                        color={relationship === 'following' ? theme.colors.text : '#FFFFFF'}
                                    />
                                    <Typography
                                        style={[
                                            styles.followButtonText,
                                            { color: relationship === 'following' ? theme.colors.text : '#FFFFFF' }
                                        ]}
                                    >
                                        {relationship === 'following'
                                            ? t('social.following', 'Following')
                                            : t('social.follow', 'Follow')
                                        }
                                    </Typography>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                    <TabButton
                        label={t('profile.tabPosts', 'Posts')}
                        count={posts.length}
                        isActive={activeTab === 'posts'}
                        onPress={() => handleTabChange('posts')}
                    />
                    <TabButton
                        label={t('profile.tabSaved', 'Saved')}
                        count={libraryItems.length}
                        isActive={activeTab === 'saved'}
                        onPress={() => handleTabChange('saved')}
                    />
                    <TabButton
                        label={t('profile.tabAbout', 'About')}
                        isActive={activeTab === 'about'}
                        onPress={() => handleTabChange('about')}
                    />
                </View>

                {/* Tab Content */}
                <View style={styles.tabContent}>
                    {renderTabContent()}
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        gap: 16,
    },
    notFoundText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textMuted,
    },
    goBackButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: theme.colors.background,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontSize: theme.typography.size.lg,
        fontWeight: '600',
        color: theme.colors.text,
        marginHorizontal: 12,
    },
    headerSpacer: {
        width: 44,
    },
    scrollContent: {
        paddingBottom: 100,
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
        borderWidth: 3,
        borderColor: theme.colors.surface,
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
        color: '#FFFFFF',
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
    reviewsSection: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: theme.typography.size.xs,
        fontWeight: '700',
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    reviewItem: {
        marginBottom: 16,
        gap: 8,
    },
    reviewStoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    reviewStoryName: {
        fontSize: theme.typography.size.sm,
        fontWeight: '600',
        color: theme.colors.text,
    },
    bioSection: {
        marginBottom: 20,
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
}))
