import React from 'react';
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/atoms/Typography';
import { OptimizedImage } from '@/components/atoms/OptimizedImage';
import { CommunityPostCard, ReviewCard, StoryGridCard } from '@/components/molecules';
import { useUserProfile } from '@/hooks/useUserProfile';
import { StoryReview, UserFavorite } from '@/types';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { useLibraryStore } from '@/store/libraryStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const {
        profile,
        posts,
        reviews,
        favorites,
        stats,
        relationship,
        loading,
        actionLoading,
        refresh,
        handleFollow,
        handleUnfollow,
        recentlyReadStory,
        libraryItems,
    } = useUserProfile(id!);

    const { actions: libraryActions } = useLibraryStore();
    const [activeTab, setActiveTab] = React.useState<'posts' | 'reviews' | 'collections'>('posts');

    if (loading && !profile) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={styles.center}>
                <Typography>{t('social.userNotFound', 'User not found')}</Typography>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Typography color={theme.colors.primary}>{t('common.goBack', 'Go Back')}</Typography>
                </Pressable>
            </View>
        );
    }

    const renderActionButton = () => {
        if (relationship === 'self') return null;

        const isFollowing = relationship === 'following';

        return (
            <Pressable
                style={[
                    styles.actionButton,
                    isFollowing && styles.actionButtonOutline,
                    actionLoading && { opacity: 0.7 }
                ]}
                onPress={() => { !actionLoading && (isFollowing ? handleUnfollow() : handleFollow()); }}
                disabled={actionLoading}
            >
                {actionLoading ? (
                    <ActivityIndicator size="small" color={isFollowing ? theme.colors.primary : theme.colors.textInverse} />
                ) : (
                    <>
                        <Ionicons
                            name={isFollowing ? 'person-remove-outline' : 'person-add'}
                            size={18}
                            color={isFollowing ? theme.colors.primary : theme.colors.textInverse}
                        />
                        <Typography
                            variant="bodyBold"
                            color={isFollowing ? theme.colors.primary : theme.colors.textInverse}
                            style={{ marginLeft: 8 }}
                        >
                            {isFollowing ? t('social.following', 'Following') : t('social.follow', 'Follow')}
                        </Typography>
                    </>
                )}
            </Pressable>
        );
    };

    const renderSocialLinks = () => {
        if (!profile.socialLinks) return null;

        const links = profile.socialLinks;
        const availableLinks = [
            { icon: 'logo-instagram', url: links.instagram, key: 'instagram' },
            { icon: 'logo-twitter', url: links.twitter, key: 'twitter' },
            { icon: 'globe-outline', url: links.website, key: 'website' },
            { icon: 'logo-github', url: links.github, key: 'github' },
        ].filter(l => l.url);

        if (availableLinks.length === 0) return null;

        return (
            <View style={styles.socialRow}>
                {availableLinks.map(link => (
                    <Pressable
                        key={link.key}
                        style={styles.socialIcon}
                        onPress={() => {
                            haptics.light();
                            // In a real app, use Linking.openURL
                            console.log(`Opening ${link.url}`);
                        }}
                    >
                        <Ionicons name={link.icon as any} size={20} color={theme.colors.textSecondary} />
                    </Pressable>
                ))}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.text} />
                </Pressable>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={theme.colors.primary} />
                }
            >
                <View style={styles.profileInfo}>
                    <View style={styles.avatarContainer}>
                        <OptimizedImage
                            source={{ uri: profile.photoURL || '' }}
                            style={styles.avatar}
                            placeholder="person-circle"
                        />
                    </View>

                    <Typography variant="h2" style={styles.displayName}>
                        {profile.displayName || 'Anonymous'}
                    </Typography>

                    {profile.isAnonymous && (
                        <View style={styles.guestBadge}>
                            <Typography variant="caption" color={theme.colors.textMuted}>Guest User</Typography>
                        </View>
                    )}

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Typography variant="title">{posts.length}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Posts</Typography>
                        </View>
                        <View style={[styles.statBox, styles.statDivider]}>
                            <Typography variant="title">{stats.followers}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Followers</Typography>
                        </View>
                        <View style={[styles.statBox, styles.statDivider]}>
                            <Typography variant="title">{stats.following}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Following</Typography>
                        </View>
                        <View style={styles.statBox}>
                            <Typography variant="title">🔥 {stats.streak}</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Streak</Typography>
                        </View>
                    </View>

                    {profile.bio && (
                        <Typography variant="body" color={theme.colors.textSecondary} style={styles.bio}>
                            {profile.bio}
                        </Typography>
                    )}

                    {renderSocialLinks()}

                    {recentlyReadStory && (
                        <View style={styles.readingStatus}>
                            <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
                            <Typography variant="body" style={{ marginLeft: 8 }}>
                                {t('social.reading', 'Currently Reading')}: <Typography variant="bodyBold">{recentlyReadStory.title}</Typography>
                            </Typography>
                        </View>
                    )}

                    {renderActionButton()}
                </View>

                <View style={styles.tabsContainer}>
                    <Pressable
                        style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
                        onPress={() => { haptics.selection(); setActiveTab('posts'); }}
                    >
                        <Ionicons
                            name="apps"
                            size={20}
                            color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <Typography
                            variant="caption"
                            color={activeTab === 'posts' ? theme.colors.primary : theme.colors.textMuted}
                            style={styles.tabText}
                        >
                            Posts
                        </Typography>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                        onPress={() => { haptics.selection(); setActiveTab('reviews'); }}
                    >
                        <Ionicons
                            name="star"
                            size={20}
                            color={activeTab === 'reviews' ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <Typography
                            variant="caption"
                            color={activeTab === 'reviews' ? theme.colors.primary : theme.colors.textMuted}
                            style={styles.tabText}
                        >
                            Reviews
                        </Typography>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
                        onPress={() => { haptics.selection(); setActiveTab('collections'); }}
                    >
                        <Ionicons
                            name="heart"
                            size={20}
                            color={activeTab === 'collections' ? theme.colors.primary : theme.colors.textMuted}
                        />
                        <Typography
                            variant="caption"
                            color={activeTab === 'collections' ? theme.colors.primary : theme.colors.textMuted}
                            style={styles.tabText}
                        >
                            Favorites
                        </Typography>
                    </Pressable>
                </View>

                <View style={styles.contentSection}>
                    {activeTab === 'posts' && (
                        <View style={styles.postsList}>
                            {posts.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>No posts yet.</Typography>
                                </View>
                            ) : (
                                posts.map(post => (
                                    <CommunityPostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={id}
                                        onLike={() => { }}
                                        onReply={() => { }}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'reviews' && (
                        <View style={styles.reviewsList}>
                            {reviews.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>No reviews yet.</Typography>
                                </View>
                            ) : (
                                reviews.map(review => (
                                    <View key={review.id} style={styles.reviewItem}>
                                        <ReviewCard
                                            userName={review.userName}
                                            userAvatar={review.userPhoto}
                                            rating={review.rating}
                                            text={review.comment}
                                        />
                                        <View style={styles.reviewStoryTag}>
                                            <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                                            <Typography variant="bodyBold" style={{ fontSize: 13, marginLeft: 6 }}>
                                                {review.storyTitle || 'English Tale'}
                                            </Typography>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'collections' && (
                        <View style={styles.collectionsGrid}>
                            {favorites.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>No favorite stories yet.</Typography>
                                </View>
                            ) : (
                                <View style={styles.grid}>
                                    {favorites.map(fav => {
                                        // Construct a partial Story object for the card
                                        const mockStory: any = {
                                            id: fav.storyId,
                                            title: fav.storyTitle,
                                            coverImage: fav.storyCover,
                                            author: 'Author', // Placeholder
                                            difficulty: 'beginner',
                                            estimatedReadTime: 5,
                                        };
                                        const isInLibrary = libraryItems.some(item => item.storyId === fav.storyId);

                                        return (
                                            <StoryGridCard
                                                key={fav.storyId}
                                                story={mockStory}
                                                isInLibrary={isInLibrary}
                                                onPress={() => router.push(`/story/${fav.storyId}`)}
                                            />
                                        );
                                    })}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingBottom: theme.spacing.xl,
    },
    avatarContainer: {
        padding: 4,
        borderRadius: 60,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    displayName: {
        fontSize: 24,
        fontWeight: '800',
        marginBottom: 4,
    },
    guestBadge: {
        backgroundColor: theme.colors.borderLight,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: theme.spacing.md,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        borderRadius: 16,
        ...theme.shadows.sm,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        borderLeftWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        marginTop: theme.spacing.xl,
        width: '100%',
        ...theme.shadows.md,
    },
    actionButtonOutline: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    readingStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        marginHorizontal: theme.spacing.xl,
        marginTop: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignSelf: 'center',
    },
    bio: {
        textAlign: 'center',
        marginTop: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
    },
    socialRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: theme.spacing.md,
        gap: theme.spacing.md,
    },
    socialIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
    },
    tabsContainer: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        backgroundColor: theme.colors.background,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        fontSize: 12,
        fontWeight: '600',
    },
    contentSection: {
        flex: 1,
        paddingBottom: 40,
    },
    postsList: {
        paddingTop: 10,
    },
    reviewsList: {
        padding: theme.spacing.lg,
        gap: 20,
    },
    reviewItem: {
        gap: 8,
    },
    reviewStoryTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 4,
    },
    collectionsGrid: {
        padding: 16,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
    },
    emptyFeed: {
        alignItems: 'center',
        paddingTop: 60,
    },
}));
