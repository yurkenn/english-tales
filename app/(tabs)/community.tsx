import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    StyleSheet as RNStyleSheet,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { Typography } from '@/components/atoms/Typography';
import { CommunityPostCard, CreatePostBar, ProfileQuickView, NotificationList } from '@/components/molecules';
import { CreatePostModal, ReplyModal } from '@/components/organisms';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';
import { useCommunityFeed } from '@/hooks/useCommunityFeed';
import { OptimizedImage } from '@/components/atoms/OptimizedImage';
import { SegmentedPicker } from '@/components/atoms/SegmentedPicker';
import { userService } from '@/services/userService';
import { UserProfile, Story } from '@/types';
import { StorySelectorModal } from '@/components/molecules/StorySelectorModal';

export default function CommunityTab() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
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
        getReplies,
    } = useCommunityFeed();

    const { notifications, unreadCount, actions: notificationActions } = useNotificationStore();
    const notificationSheetRef = useRef<BottomSheet>(null);

    // Seed community logic removed to prevent interference with user testing

    // Create Post State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reply State
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [isReplying, setIsReplying] = useState(false);

    // Filter Categories
    const categories = [
        { label: t('social.all', 'For You'), value: 'all' as const },
        { label: t('social.following', 'Following'), value: 'following' as const },
    ];

    // Quick View State
    const quickViewRef = useRef<BottomSheet>(null);
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

    const handleAvatarPress = async (userId: string) => {
        haptics.selection();
        const result = await userService.getUserProfile(userId);
        if (result.success) {
            setSelectedUser(result.data);
            quickViewRef.current?.expand();
        }
    };

    // Story Tagging State
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);

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

    const handleSubmitReply = async (content: string) => {
        if (!replyingTo || isReplying) return;

        setIsReplying(true);
        const success = await handleAddReply(replyingTo, content);
        setIsReplying(false);

        if (success) {
            setReplyingTo(null);
        }
    };

    const handleNotificationPress = (notification: any) => {
        notificationActions.markAsRead(user?.id || '', notification.id);
        if (notification.postId) {
            // Future scroll-to or view post modal
            notificationSheetRef.current?.close();
        } else if (notification.type === 'follow') {
            router.push(`/user/${notification.senderId}`);
            notificationSheetRef.current?.close();
        }
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <Typography variant="h2" style={styles.headerTitle}>{t('social.title', 'Community')}</Typography>
                <View style={styles.headerButtons}>
                    <Pressable
                        style={styles.trophyButton}
                        onPress={() => {
                            haptics.selection();
                            notificationSheetRef.current?.expand();
                        }}
                    >
                        <Ionicons name="notifications-outline" size={22} color={theme.colors.text} />
                        {unreadCount > 0 && (
                            <View style={styles.badge} />
                        )}
                    </Pressable>
                    <Pressable
                        style={styles.trophyButton}
                        onPress={() => router.push('/rankings')}
                    >
                        <Ionicons name="trophy-outline" size={22} color={theme.colors.text} />
                    </Pressable>
                </View>
            </View>

            <View style={styles.filterSection}>
                <SegmentedPicker
                    options={categories}
                    selectedValue={filter}
                    onValueChange={setFilter}
                    style={styles.picker}
                />
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScroll={({ nativeEvent }) => {
                    const isCloseToBottom = nativeEvent.layoutMeasurement.height + nativeEvent.contentOffset.y >= nativeEvent.contentSize.height - 20;
                    if (isCloseToBottom) {
                        handleLoadMore();
                    }
                }}
                scrollEventThrottle={400}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                <CreatePostBar
                    userPhotoUrl={user?.photoURL}
                    placeholder={t('social.shareSomething', 'Share your progress...')}
                    onPress={() => setIsCreateModalOpen(true)}
                />

                {posts.length === 0 && !loading ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.border} />
                        <Typography color={theme.colors.textMuted} style={{ marginTop: 16 }}>
                            {t('social.noPosts', 'No posts yet. Be the first to share!')}
                        </Typography>
                    </View>
                ) : (
                    posts.map(post => (
                        <CommunityPostCard
                            key={post.id}
                            post={post}
                            currentUserId={user?.id}
                            onLike={handleToggleLike}
                            onReply={handleOpenReply}
                            onAvatarPress={handleAvatarPress}
                        />
                    ))
                )}

                {loading && (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 20 }} />
                )}
            </ScrollView>

            <Pressable
                style={[styles.fab, { bottom: insets.bottom + 16 }]}
                onPress={() => { haptics.selection(); setIsCreateModalOpen(true); }}
            >
                <Ionicons name="add" size={32} color={theme.colors.textInverse} />
            </Pressable>

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

            {/* Reply Modal */}
            <ReplyModal
                visible={!!replyingTo}
                onClose={() => setReplyingTo(null)}
                onSubmit={handleSubmitReply}
                isSubmitting={isReplying}
            />

            {/* Profile Quick View */}
            {selectedUser && (
                <ProfileQuickView
                    ref={quickViewRef}
                    profile={selectedUser}
                    onClose={() => setSelectedUser(null)}
                />
            )}

            {/* Notifications Sheet */}
            <BottomSheet
                ref={notificationSheetRef}
                index={-1}
                snapPoints={['70%']}
                enablePanDownToClose
                backgroundStyle={{ backgroundColor: theme.colors.surface }}
                handleIndicatorStyle={{ backgroundColor: theme.colors.textMuted }}
            >
                <View style={styles.notificationHeader}>
                    <Typography variant="h3">Activity</Typography>
                    {unreadCount > 0 && (
                        <Pressable onPress={() => notificationActions.markAllAsRead(user?.id || '')}>
                            <Typography variant="body" color={theme.colors.primary}>Mark all as read</Typography>
                        </Pressable>
                    )}
                </View>
                <NotificationList
                    notifications={notifications}
                    onNotificationPress={handleNotificationPress}
                />
            </BottomSheet>
            {/* Story Selector Modal */}
            <StorySelectorModal
                visible={isStoryModalOpen}
                onClose={() => setIsStoryModalOpen(false)}
                onSelect={(story) => {
                    setSelectedStory(story);
                    setIsStoryModalOpen(false);
                }}
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
        paddingVertical: theme.spacing.md,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
    },
    trophyButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    headerButtons: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.colors.error,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
    },
    filterSection: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.md,
    },
    picker: {
        marginBottom: 4,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.md,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    sendButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 20,
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
