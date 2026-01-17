import { useMemo } from 'react';
import { View, Pressable, RefreshControl, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';

import { Typography } from '@/components/atoms/Typography';
import { SegmentedPicker } from '@/components/atoms/SegmentedPicker';
import { CreatePostBar, NotificationList, StorySelectorModal } from '@/components/molecules';
import { TrendingStoriesRibbon } from '@/components/molecules/community';
import { CommunityPostCard, CreatePostModal, PostActionSheet, UserProfileSheet } from '@/components/organisms';
import { CommunityScreenSkeleton } from '@/components';

import { useAuthStore } from '@/store/authStore';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { useCommunityHandlers } from '@/hooks';
import { useStories } from '@/hooks/useQueries';
import { mapSanityStory } from '@/utils/storyMapper';
import type { Story } from '@/types';

const HEADER_HEIGHT = 120;

export default function CommunityTab() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { user } = useAuthStore();

    // Trending stories data
    const { data: storiesData } = useStories();
    const trendingStories = useMemo(() => storiesData?.map(mapSanityStory).slice(0, 6) || [], [storiesData]);

    // Community feed hook
    const {
        posts,
        loading,
        refreshing,
        filter,
        setFilter,
        handleRefresh,
        handleCreatePost,
        handleToggleLike,
    } = useCommunityFeed();

    // Handlers hook
    const handlers = useCommunityHandlers({
        userId: user?.id,
        handleCreatePost,
        handleRefresh,
    });

    // Scroll Animation
    const scrollY = useSharedValue(0);
    const scrollHandler = useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
    });

    // Filter Categories
    const categories = [
        { label: t('social.all', 'For You'), value: 'all' as const },
        { label: t('social.following', 'Following'), value: 'following' as const },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 8, paddingHorizontal: containerPadding }]}>
                <Typography variant="h2" style={styles.headerTitle}>{t('social.title', 'Community')}</Typography>
                <View style={styles.headerButtons}>
                    <Pressable style={styles.headerActionBtn} onPress={handlers.openNotifications}>
                        <Feather name="bell" size={22} color={theme.colors.text} />
                        {handlers.unreadCount > 0 && <View style={styles.badge} />}
                    </Pressable>
                </View>
            </View>

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
                {/* Filter Section */}
                <View style={[styles.filterSection, { paddingHorizontal: containerPadding }]}>
                    <SegmentedPicker options={categories} selectedValue={filter} onValueChange={setFilter} />
                </View>

                {/* Trending Stories */}
                <TrendingStoriesRibbon stories={trendingStories} containerPadding={containerPadding} />

                <CreatePostBar
                    userPhotoUrl={user?.photoURL}
                    placeholder={t('social.shareSomething', 'Share your progress...')}
                    onPress={handlers.openCreateModal}
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
                            posts.map((post, index) => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    currentUserId={user?.id}
                                    onLike={handleToggleLike}
                                    onReply={handlers.handleOpenReply}
                                    onMorePress={handlers.handleMorePress}
                                    onAvatarPress={handlers.handleAvatarPress}
                                    onPress={() => handlers.handlePostPress(post.id)}
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

            {/* FAB */}
            {!handlers.isActionSheetOpen && (
                <Pressable style={[styles.fab, { bottom: insets.bottom + 90 }]} onPress={handlers.openCreateModal}>
                    <Feather name="plus" size={28} color={theme.colors.textInverse} />
                </Pressable>
            )}

            {/* Create Post Modal */}
            <CreatePostModal
                visible={handlers.isCreateModalOpen}
                onClose={() => handlers.setIsCreateModalOpen(false)}
                onSubmit={handlers.handleSubmitPost}
                user={user}
                isSubmitting={handlers.isSubmitting}
                onOpenStorySelector={() => handlers.setIsStoryModalOpen(true)}
                selectedStory={handlers.selectedStory}
                onRemoveStory={() => handlers.setSelectedStory(null)}
            />

            {/* Notifications Sheet */}
            <BottomSheet
                ref={handlers.notificationSheetRef}
                index={-1}
                snapPoints={['75%']}
                enablePanDownToClose
                enableDynamicSizing={false}
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
            >
                <View style={styles.notificationHeader}>
                    <Typography variant="h3">Activity</Typography>
                    {handlers.unreadCount > 0 && (
                        <Pressable onPress={() => handlers.notificationActions.markAllAsRead(user?.id || '')}>
                            <Typography variant="body" color={theme.colors.primary}>Mark all read</Typography>
                        </Pressable>
                    )}
                </View>
                <NotificationList notifications={handlers.notifications} onNotificationPress={handlers.handleNotificationPress} />
            </BottomSheet>

            <StorySelectorModal
                visible={handlers.isStoryModalOpen}
                onClose={() => handlers.setIsStoryModalOpen(false)}
                onSelect={(story: Story) => {
                    handlers.setSelectedStory(story);
                    handlers.setIsStoryModalOpen(false);
                }}
            />

            {/* Post Actions Sheet */}
            {handlers.selectedPostId && (
                <PostActionSheet
                    sheetRef={handlers.postActionSheetRef}
                    postId={handlers.selectedPostId}
                    currentUserId={user?.id || null}
                    onPostDeleted={handlers.handlePostDeleted}
                    onClose={handlers.handleActionSheetClose}
                />
            )}

            {/* User Profile Sheet */}
            {handlers.selectedProfileUserId && (
                <UserProfileSheet
                    ref={handlers.userProfileSheetRef}
                    userId={handlers.selectedProfileUserId}
                    onClose={handlers.handleProfileSheetClose}
                />
            )}
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
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
            fontSize: theme.typography.size.xxxl,
            fontWeight: 'bold',
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
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.surfaceElevated,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            ...theme.shadows.sm,
        },
        badge: {
            position: 'absolute',
            top: 10,
            right: 10,
            width: 8,
            height: 8,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.error,
            borderWidth: 1.5,
            borderColor: theme.colors.surfaceElevated,
        },
        filterSection: {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: 0,
            paddingBottom: theme.spacing.md,
        },
        content: {
            flex: 1,
        },
        scrollContent: {
            paddingTop: theme.spacing.sm,
        },
        fab: {
            position: 'absolute',
            right: theme.spacing.xl,
            width: 64,
            height: 64,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            ...theme.shadows.lg,
        },
        emptyContainer: {
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: theme.spacing.xxxxl * 2,
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
    });
}
