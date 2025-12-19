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
        relationship,
        loading,
        actionLoading,
        refresh,
        handleAddFriend,
        handleAcceptRequest,
        handleRemoveFriend,
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

        let icon: keyof typeof Ionicons.glyphMap = 'person-add';
        let label = t('social.addFriend', 'Add Friend');
        let onPress = handleAddFriend;
        let variant: 'primary' | 'outline' | 'error' = 'primary';

        if (relationship === 'pending_sent') {
            icon = 'time-outline';
            label = t('social.pending', 'Pending');
            onPress = handleRemoveFriend; // Cancel request
            variant = 'outline';
        } else if (relationship === 'pending_received') {
            icon = 'checkmark-circle-outline';
            label = t('social.accept', 'Accept');
            onPress = handleAcceptRequest;
            variant = 'primary';
        } else if (relationship === 'accepted') {
            icon = 'people';
            label = t('social.friends', 'Friends');
            onPress = handleRemoveFriend;
            variant = 'outline';
        }

        return (
            <Pressable
                style={[
                    styles.actionButton,
                    variant === 'outline' && styles.actionButtonOutline,
                    actionLoading && { opacity: 0.7 }
                ]}
                onPress={() => { !actionLoading && onPress(); }}
                disabled={actionLoading}
            >
                {actionLoading ? (
                    <ActivityIndicator size="small" color={variant === 'primary' ? theme.colors.textInverse : theme.colors.primary} />
                ) : (
                    <>
                        <Ionicons
                            name={icon}
                            size={18}
                            color={variant === 'primary' ? theme.colors.textInverse : theme.colors.primary}
                        />
                        <Typography
                            variant="bodyBold"
                            color={variant === 'primary' ? theme.colors.textInverse : theme.colors.primary}
                            style={{ marginLeft: 8 }}
                        >
                            {label}
                        </Typography>
                    </>
                )}
            </Pressable>
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
                            <Typography variant="title">0</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Friends</Typography>
                        </View>
                        <View style={styles.statBox}>
                            <Typography variant="title">🔥 0</Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>Streak</Typography>
                        </View>
                    </View>

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
                            Collection
                        </Typography>
                    </Pressable>
                </View>

                <View style={styles.contentSection}>
                    {activeTab === 'posts' && (
                        <View style={styles.postsList}>
                            {posts.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>
                                        {t('social.noPostsYet', 'No post shared yet.')}
                                    </Typography>
                                </View>
                            ) : (
                                posts.map(post => (
                                    <CommunityPostCard
                                        key={post.id}
                                        post={post}
                                        currentUserId={id}
                                    />
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'reviews' && (
                        <View style={styles.reviewsList}>
                            {reviews.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>
                                        {t('social.noReviewsYet', 'No reviews yet.')}
                                    </Typography>
                                </View>
                            ) : (
                                reviews.map((review: StoryReview) => (
                                    <View key={review.id} style={styles.reviewItem}>
                                        <ReviewCard
                                            userName={profile.displayName || 'Anonymous'}
                                            userAvatar={profile.photoURL || undefined}
                                            rating={review.rating}
                                            text={review.comment}
                                        />
                                        <Pressable
                                            style={styles.reviewStoryTag}
                                            onPress={() => router.push(`/story/${review.storyId}`)}
                                        >
                                            <Ionicons name="book-outline" size={14} color={theme.colors.primary} />
                                            <Typography variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                                                View Story
                                            </Typography>
                                        </Pressable>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {activeTab === 'collections' && (
                        <View style={styles.collectionsGrid}>
                            {favorites.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Typography color={theme.colors.textMuted}>
                                        {t('social.noFavoritesYet', 'No favorite stories yet.')}
                                    </Typography>
                                </View>
                            ) : (
                                <View style={styles.grid}>
                                    {favorites.map((fav: UserFavorite) => (
                                        <StoryGridCard
                                            key={fav.storyId}
                                            story={{
                                                id: fav.storyId,
                                                title: fav.storyTitle,
                                                coverImage: fav.storyCover,
                                                author: '', // We don't have it in fav, could add but for now keep it empty
                                                difficulty: 'beginner' as const,
                                                estimatedReadTime: 0,
                                            } as any}
                                            isInLibrary={libraryActions.isInLibrary(fav.storyId)}
                                            onPress={() => router.push(`/story/${fav.storyId}`)}
                                        />
                                    ))}
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
        paddingHorizontal: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
        zIndex: 10,
    },
    backButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 22,
        backgroundColor: theme.colors.surface,
        ...theme.shadows.sm,
    },
    profileInfo: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 30,
        backgroundColor: theme.colors.background,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: theme.colors.surface,
        padding: 4,
        ...theme.shadows.md,
        marginBottom: 16,
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 56,
    },
    displayName: {
        fontWeight: '900',
        marginBottom: 4,
    },
    guestBadge: {
        backgroundColor: theme.colors.borderLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginBottom: 16,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 24,
        backgroundColor: theme.colors.surface,
        borderRadius: 20,
        paddingVertical: 16,
        paddingHorizontal: 24,
        width: SCREEN_WIDTH - 64,
        ...theme.shadows.sm,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
        minWidth: 200,
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    actionButtonOutline: {
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    feedSection: {
        paddingTop: 10,
    },
    sectionTitle: {
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        fontSize: 20,
        fontWeight: '800',
    },
    emptyFeed: {
        alignItems: 'center',
        paddingTop: 60,
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
}));
