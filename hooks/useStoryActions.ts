import { useRef, useState, useCallback } from 'react';
import { Share } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { PortableTextBlock } from '@portabletext/types';

import { useLibraryStore } from '@/store/libraryStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useSubscriptionStore } from '@/store/subscriptionStore';
import { useProgressStore } from '@/store/progressStore';
import { useToastStore } from '@/store/toastStore';
import { useCreateReview } from '@/hooks/useQueries';
import { useFavorites } from '@/hooks/useFavorites';
import { haptics } from '@/utils/haptics';
import { checkStoryAccess } from '@/services/storyGating';
import type { Story } from '@/types';

interface UseStoryActionsProps {
    story: Story | null;
    storyDoc: any;
    userId?: string;
    userName?: string;
    userPhoto?: string;
}

/**
 * Custom hook for story detail action handlers and modal state.
 */
export function useStoryActions({
    story,
    storyDoc,
    userId,
    userName,
    userPhoto,
}: UseStoryActionsProps) {
    const router = useRouter();

    // Refs
    const writeReviewSheetRef = useRef<BottomSheet>(null);
    const removeDownloadDialogRef = useRef<BottomSheet>(null);

    // Modal states
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showPaywallModal, setShowPaywallModal] = useState(false);

    // Stores
    const { actions: libraryActions } = useLibraryStore();
    const { downloads, actions: downloadActions } = useDownloadStore();
    const isPremium = useSubscriptionStore((s) => s.isPremium);
    const progressMap = useProgressStore((s) => s.progressMap);

    // Favorites
    const { isFavorited, toggleFavorite } = useFavorites(story?.id || '');

    // Reviews
    const createReview = useCreateReview();

    // Calculate story index for gating
    const storyIndex = Object.keys(progressMap).length;

    // Library status
    const isInLibrary = story ? libraryActions.isInLibrary(story.id) : false;

    // Handlers
    const handleBookmarkPress = useCallback(async () => {
        if (!story) return;
        haptics.selection();
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    }, [story, isInLibrary, libraryActions]);

    const handleFavoritePress = useCallback(async () => {
        if (!story) return;
        await toggleFavorite(story.title, story.coverImage);
    }, [story, toggleFavorite]);

    const handleStartReading = useCallback(() => {
        if (!story) return;
        haptics.selection();

        const accessResult = checkStoryAccess(story.id, storyIndex, story.isPremiumOnly);

        if (accessResult.status === 'free' || accessResult.status === 'unlocked') {
            requestAnimationFrame(() => {
                router.push(`/reading/${story.id}`);
            });
        } else {
            setShowUnlockModal(true);
        }
    }, [story, storyIndex, router]);

    const handleUnlockSuccess = useCallback(() => {
        setShowUnlockModal(false);
        if (story) {
            requestAnimationFrame(() => {
                router.push(`/reading/${story.id}`);
            });
        }
    }, [story, router]);

    const handleSharePress = useCallback(async () => {
        if (!story) return;
        haptics.selection();
        try {
            await Share.share({
                title: story.title,
                message: `Check out this story on English Tales: ${story.title}\n\n${story.description}`,
            });
        } catch (error) {
            console.error('Error sharing story:', error);
        }
    }, [story]);

    const handleDownload = useCallback(async () => {
        if (!story || !storyDoc) return;
        haptics.selection();
        const toastActions = useToastStore.getState().actions;
        const content = storyDoc.content as PortableTextBlock[] | undefined;
        if (content) {
            const success = await downloadActions.downloadStory(story as any, content);
            if (success) {
                haptics.success();
                toastActions.success('Downloaded for offline reading');
            } else {
                toastActions.error('Download failed. Please try again.');
            }
        }
    }, [story, storyDoc, downloadActions]);

    const handleRemoveDownload = useCallback(async () => {
        if (!story) return;
        await downloadActions.deleteDownload(story.id);
        haptics.selection();
        removeDownloadDialogRef.current?.close();
        useToastStore.getState().actions.success('Download removed');
    }, [story, downloadActions]);

    const handleOpenRemoveDialog = useCallback(() => {
        haptics.selection();
        removeDownloadDialogRef.current?.expand();
    }, []);

    const handleOpenWriteReview = useCallback(() => {
        haptics.selection();
        writeReviewSheetRef.current?.expand();
    }, []);

    const handleSubmitReview = useCallback(async (rating: number, text: string) => {
        if (!userId || !story) return;
        try {
            await createReview.mutateAsync({
                storyId: story.id,
                userId,
                userName: userName || 'Anonymous',
                userAvatar: userPhoto || undefined,
                rating,
                text,
            });
            writeReviewSheetRef.current?.close();
        } catch (error) {
            console.error('Failed to submit review:', error);
        }
    }, [userId, userName, userPhoto, story, createReview]);

    const handlePaywallSuccess = useCallback(() => {
        setShowPaywallModal(false);
        if (story) {
            router.push(`/reading/${story.id}`);
        }
    }, [story, router]);

    return {
        // Refs
        writeReviewSheetRef,
        removeDownloadDialogRef,

        // Modal states
        showUnlockModal,
        setShowUnlockModal,
        showPaywallModal,
        setShowPaywallModal,

        // Derived state
        isFavorited,
        isInLibrary,
        downloads,
        downloadActions,

        // Handlers
        handleBookmarkPress,
        handleFavoritePress,
        handleStartReading,
        handleUnlockSuccess,
        handleSharePress,
        handleDownload,
        handleRemoveDownload,
        handleOpenRemoveDialog,
        handleOpenWriteReview,
        handleSubmitReview,
        handlePaywallSuccess,
    };
}
