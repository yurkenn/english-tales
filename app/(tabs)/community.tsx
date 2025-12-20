import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    useAnimatedScrollHandler,
    interpolate,
    Extrapolate,
    FadeInDown,
} from 'react-native-reanimated';
import { Typography } from '@/components/atoms/Typography';
import { CreatePostBar, ProfileQuickView, NotificationList } from '@/components/molecules';
import { CommunityPostCard, CreatePostModal, ReplyModal, PostActionSheet } from '@/components/organisms';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { OptimizedImage } from '@/components/atoms/OptimizedImage';
import { SegmentedPicker } from '@/components/atoms/SegmentedPicker';
import { UserProfile, Story } from '@/types';
import { useStories } from '@/hooks/useQueries';
import { mapSanityStory } from '@/utils/storyMapper';
import { StorySelectorModal } from '@/components/molecules/StorySelectorModal';

const HEADER_HEIGHT = 120;

import { CommunityScreenSkeleton } from '@/components';

export default function CommunityTab() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();

    // Fetch stories for trending section
    const { data: storiesData } = useStories();
    const trendingStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData]);

    const {
        posts,
        loading,
        refreshing,
        filter,
        setFilter,
        handleRefresh,
        handleLoadMore,
        handleCreatePost,
        handleToggleLike,
        handleAddReply,
    } = useCommunityFeed();

    const { notifications, unreadCount, actions: notificationActions } = useNotificationStore();
    const notificationSheetRef = useRef<BottomSheet>(null);

    // Scroll Animation Logic
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    const headerAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -10], Extrapolate.CLAMP) }
            ],
            opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT / 2], [1, 0.9], Extrapolate.CLAMP),
        };
    });

    const titleAnimatedStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { scale: interpolate(scrollY.value, [0, HEADER_HEIGHT], [1, 0.85], Extrapolate.CLAMP) },
                { translateX: interpolate(scrollY.value, [0, HEADER_HEIGHT], [0, -10], Extrapolate.CLAMP) }
            ],
        };
    });

    // Create Post State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter Categories
    const categories = [
        { label: t('social.all', 'For You'), value: 'all' as const },
        { label: t('social.following', 'Following'), value: 'following' as const },
    ];

    // Quick View State
    const quickViewRef = useRef<BottomSheet>(null);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const postActionSheetRef = useRef<BottomSheet>(null);

    const handleMorePress = (postId: string) => {
        setSelectedPostId(postId);
        setIsActionSheetOpen(true);
        postActionSheetRef.current?.expand();
    };

    const handleActionSheetClose = () => {
        setIsActionSheetOpen(false);
    };

    const handlePostDeleted = () => {
        handleRefresh();
    };

    const handleSubmitPost = async (content: string, story: Story | null) => {
        setIsSubmitting(true);
        const metadata = story ? {
            storyId: (story as any)._id || story.id,
            storyTitle: story.title
        } : undefined;

        const success = await handleCreatePost(content, 'thought', metadata);
        setIsSubmitting(false);

        if (success) {
            setSelectedStory(null);
            setIsCreateModalOpen(false);
        }
    };

    const handleOpenReply = (postId: string) => {
        haptics.selection();
        router.push(`/community/${postId}`);
    };

    const handleNotificationPress = (notification: any) => {
        notificationActions.markAsRead(user?.id || '', notification.id);
        notificationSheetRef.current?.close();
        if (notification.postId) {
            router.push(`/community/${notification.postId}`);
        } else if (notification.type === 'follow') {
            router.push(`/user/${notification.senderId}`);
        }
    };

    // Memoized trending slice
    const trendingList = useMemo(() => trendingStories.slice(0, 6), [trendingStories]);

    return (
        <View style={styles.container}>
            {/* Header with Parallax */}
            <Animated.View style={[
                styles.header,
                { paddingTop: insets.top },
                headerAnimatedStyle
            ]}>
                <Animated.View style={titleAnimatedStyle}>
                    <Typography variant="h2" style={styles.headerTitle}>{t('social.title', 'Community')}</Typography>
                </Animated.View>

                <View style={styles.headerButtons}>
                    <Pressable
                        style={styles.headerActionBtn}
                        onPress={() => {
                            haptics.selection();
                            notificationSheetRef.current?.expand();
                        }}
                    >
                        <Feather name="bell" size={22} color={theme.colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.badge} />
                        )}
                    </Pressable>
                </View>
            </Animated.View>

            <Animated.ScrollView
                style={styles.content}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 120 }]}
                showsVerticalScrollIndicator={false}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                        progressViewOffset={HEADER_HEIGHT}
                    />
                }
            >
                {/* Filter Section (Inside Scroll for better UX) */}
                <View style={styles.filterSection}>
                    <SegmentedPicker
                        options={categories}
                        selectedValue={filter}
                        onValueChange={setFilter}
                    />
                </View>

                {/* Trending Stories Ribbon */}
                <View style={styles.trendingSection}>
                    <View style={styles.sectionHeader}>
                        <Feather name="trending-up" size={14} color={theme.colors.primary} />
                        <Typography variant="label" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                            {t('social.trendingNow', 'Trending Now')}
                        </Typography>
                    </View>
                    <Animated.ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.trendingScroll}
                    >
                        {trendingList.map((story: Story, index: number) => (
                            <Animated.View
                                key={story.id}
                                entering={FadeInDown.delay(index * 100)}
                                style={styles.trendingItem}
                            >
                                <Pressable
                                    onPress={() => { haptics.selection(); router.push(`/story/${story.id}`); }}
                                    style={styles.trendingCoverWrapper}
                                >
                                    <OptimizedImage
                                        source={{ uri: story.coverImage }}
                                        style={styles.trendingCover}
                                    />
                                    <View style={styles.hotBadge}>
                                        <Feather name="zap" size={10} color="#FFF" />
                                    </View>
                                </Pressable>
                                <Typography variant="label" numberOfLines={1} style={styles.trendingTitle}>
                                    {story.title}
                                </Typography>
                            </Animated.View>
                        ))}
                    </Animated.ScrollView>
                </View>

                <CreatePostBar
                    userPhotoUrl={user?.photoURL}
                    placeholder={t('social.shareSomething', 'Share your progress...')}
                    onPress={() => setIsCreateModalOpen(true)}
                />

                {loading && posts.length === 0 ? (
                    <CommunityScreenSkeleton />
                ) : (
                    <>
                        {posts.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Feather name="message-square" size={48} color={theme.colors.border} />
                                <Typography color={theme.colors.textMuted} style={{ marginTop: 16 }}>
                                    {t('social.noPosts', 'No posts yet. Be the first to share!')}
                                </Typography>
                            </View>
                        ) : (
                            posts.map((post, index: number) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user?.id}
                                    onLike={handleToggleLike}
                                    onReply={handleOpenReply}
                                    onMorePress={handleMorePress}
                                    index={index}
                                />
                            ))
                        )}
                    </>
                )}

                {loading && posts.length > 0 && (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                )}
            </Animated.ScrollView>

            {!isActionSheetOpen && (
                <Pressable
                    style={[styles.fab, { bottom: insets.bottom + 90 }]}
                    onPress={() => { haptics.selection(); setIsCreateModalOpen(true); }}
                >
                    <Feather name="plus" size={28} color={theme.colors.textInverse} />
                </Pressable>
            )}

            {/* Create Post Modal */}
            <CreatePostModal
                visible={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSubmit={handleSubmitPost}
                user={user}
                isSubmitting={isSubmitting}
                onOpenStorySelector={() => setIsStoryModalOpen(true)}
                selectedStory={selectedStory}
                onRemoveStory={() => setSelectedStory(null)}
            />

            {/* Notifications Sheet */}
            <BottomSheet
                ref={notificationSheetRef}
                index={-1}
                snapPoints={['75%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
            >
                <View style={styles.notificationHeader}>
                    <Typography variant="h3">Activity</Typography>
                    {unreadCount > 0 && (
                        <Pressable onPress={() => { haptics.selection(); notificationActions.markAllAsRead(user?.id || ''); }}>
                            <Typography variant="body" color={theme.colors.primary}>Mark all read</Typography>
                        </Pressable>
                    )}
                </View>
                <NotificationList
                    notifications={notifications}
                    onNotificationPress={handleNotificationPress}
                />
            </BottomSheet>

            <StorySelectorModal
                visible={isStoryModalOpen}
                onClose={() => setIsStoryModalOpen(false)}
                onSelect={(story: Story) => {
                    setSelectedStory(story);
                    setIsStoryModalOpen(false);
                }}
            />

            {/* Post Actions Sheet */}
            <PostActionSheet
                sheetRef={postActionSheetRef}
                postId={selectedPostId}
                currentUserId={user?.id || null}
                onPostDeleted={handlePostDeleted}
                onClose={handleActionSheetClose}
            />
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
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
        backgroundColor: theme.colors.background,
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    headerActionBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    badge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.error,
        borderWidth: 1.5,
        borderColor: theme.colors.surfaceElevated,
    },
    filterSection: {
        paddingHorizontal: theme.spacing.lg,
        marginTop: 10,
        marginBottom: 16,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 10,
    },
    trendingSection: {
        marginBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        marginBottom: 12,
    },
    trendingScroll: {
        paddingHorizontal: theme.spacing.lg,
        gap: 16,
    },
    trendingItem: {
        width: 70,
        alignItems: 'center',
    },
    trendingCoverWrapper: {
        width: 70,
        height: 100,
        borderRadius: 12,
        backgroundColor: theme.colors.surfaceElevated,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    trendingCover: {
        width: '100%',
        height: '100%',
    },
    hotBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: theme.colors.error,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#FFF',
    },
    trendingTitle: {
        marginTop: 6,
        width: '100%',
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
}));
