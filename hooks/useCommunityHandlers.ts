import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'expo-router';
import BottomSheet, { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useNotificationStore } from '@/store/notificationStore';
import { haptics } from '@/utils/haptics';
import type { Story, ActivityType } from '@/types';

interface UseCommunityHandlersProps {
    userId?: string;
    handleCreatePost: (content: string, type?: ActivityType, metadata?: any) => Promise<boolean | undefined>;
    handleRefresh: () => void;
}

/**
 * Custom hook for community screen handlers and modal state.
 */
export function useCommunityHandlers({
    userId,
    handleCreatePost,
    handleRefresh,
}: UseCommunityHandlersProps) {
    const router = useRouter();

    // Notification store
    const { notifications, unreadCount, actions: notificationActions } = useNotificationStore();
    const notificationSheetRef = useRef<BottomSheet>(null);

    // Create Post State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);

    // Post Actions State
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
    const postActionSheetRef = useRef<BottomSheet>(null);

    // User Profile Sheet state
    const [selectedProfileUserId, setSelectedProfileUserId] = useState<string | null>(null);
    const userProfileSheetRef = useRef<BottomSheetModal>(null);

    // Handlers
    const handleAvatarPress = useCallback((targetUserId: string) => {
        haptics.selection();
        setSelectedProfileUserId(targetUserId);
        setTimeout(() => userProfileSheetRef.current?.present(), 50);
    }, []);

    const handleProfileSheetClose = useCallback(() => {
        userProfileSheetRef.current?.dismiss();
        setSelectedProfileUserId(null);
    }, []);

    const handlePostPress = useCallback((postId: string) => {
        haptics.selection();
        router.push(`/community/${postId}`);
    }, [router]);

    const handleMorePress = useCallback((postId: string) => {
        setSelectedPostId(postId);
        setIsActionSheetOpen(true);
        postActionSheetRef.current?.expand();
    }, []);

    const handleActionSheetClose = useCallback(() => {
        setIsActionSheetOpen(false);
        setSelectedPostId(null);
    }, []);

    const handlePostDeleted = useCallback(() => {
        handleRefresh();
    }, [handleRefresh]);

    const handleSubmitPost = useCallback(async (content: string, story: Story | null) => {
        setIsSubmitting(true);
        const metadata = story ? { storyId: (story as any)._id || story.id, storyTitle: story.title } : undefined;
        const success = await handleCreatePost(content, 'thought', metadata);
        setIsSubmitting(false);
        if (success) {
            setSelectedStory(null);
            setIsCreateModalOpen(false);
        }
    }, [handleCreatePost]);

    const handleOpenReply = useCallback((postId: string) => {
        haptics.selection();
        router.push(`/community/${postId}`);
    }, [router]);

    const handleNotificationPress = useCallback((notification: any) => {
        notificationActions.markAsRead(userId || '', notification.id);
        notificationSheetRef.current?.close();
        if (notification.postId) router.push(`/community/${notification.postId}`);
        else if (notification.type === 'follow') router.push(`/user/${notification.senderId}`);
    }, [notificationActions, userId, router]);

    const openNotifications = useCallback(() => {
        haptics.selection();
        notificationSheetRef.current?.expand();
    }, []);

    const openCreateModal = useCallback(() => {
        haptics.selection();
        setIsCreateModalOpen(true);
    }, []);

    return {
        // Notification state
        notifications,
        unreadCount,
        notificationSheetRef,
        notificationActions,

        // Create Post state
        isCreateModalOpen,
        setIsCreateModalOpen,
        isSubmitting,
        isStoryModalOpen,
        setIsStoryModalOpen,
        selectedStory,
        setSelectedStory,

        // Post Actions state  
        selectedPostId,
        isActionSheetOpen,
        postActionSheetRef,

        // User Profile state
        selectedProfileUserId,
        userProfileSheetRef,

        // Handlers
        handleAvatarPress,
        handleProfileSheetClose,
        handlePostPress,
        handleMorePress,
        handleActionSheetClose,
        handlePostDeleted,
        handleSubmitPost,
        handleOpenReply,
        handleNotificationPress,
        openNotifications,
        openCreateModal,
    };
}
