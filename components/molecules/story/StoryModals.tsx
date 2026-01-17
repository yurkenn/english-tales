import { FC, memo } from 'react';
import BottomSheet from '@gorhom/bottom-sheet';

import {
    WriteReviewSheet,
    ConfirmationDialog,
    StoryUnlockModal,
    PaywallModal,
} from '@/components';

interface StoryModalsProps {
    // Write Review
    writeReviewRef: React.RefObject<BottomSheet | null>;
    storyTitle: string;
    onSubmitReview: (rating: number, text: string) => Promise<void>;

    // Remove Download
    removeDownloadRef: React.RefObject<BottomSheet | null>;
    onConfirmRemoveDownload: () => void;

    // Unlock Modal
    showUnlockModal: boolean;
    storyId: string;
    storyCover?: string;
    isPremiumOnly?: boolean;
    onCloseUnlock: () => void;
    onUnlocked: () => void;
    onGetPremium: () => void;

    // Paywall Modal
    showPaywallModal: boolean;
    onClosePaywall: () => void;
    onPaywallSuccess: () => void;
}

export const StoryModals: FC<StoryModalsProps> = memo(({
    writeReviewRef,
    storyTitle,
    onSubmitReview,
    removeDownloadRef,
    onConfirmRemoveDownload,
    showUnlockModal,
    storyId,
    storyCover,
    isPremiumOnly,
    onCloseUnlock,
    onUnlocked,
    onGetPremium,
    showPaywallModal,
    onClosePaywall,
    onPaywallSuccess,
}) => {
    return (
        <>
            {/* Write Review Sheet */}
            <WriteReviewSheet
                ref={writeReviewRef}
                storyTitle={storyTitle}
                onClose={() => writeReviewRef.current?.close()}
                onSubmit={onSubmitReview}
            />

            {/* Remove Download Confirmation */}
            <ConfirmationDialog
                ref={removeDownloadRef}
                title="Remove Download"
                message="This story will no longer be available offline."
                confirmLabel="Remove"
                cancelLabel="Cancel"
                destructive
                icon="cloud-offline-outline"
                onConfirm={onConfirmRemoveDownload}
                onCancel={() => removeDownloadRef.current?.close()}
            />

            {/* Story Unlock Modal */}
            <StoryUnlockModal
                visible={showUnlockModal}
                storyId={storyId}
                storyTitle={storyTitle}
                storyCover={storyCover}
                isPremiumOnly={isPremiumOnly}
                onClose={onCloseUnlock}
                onUnlocked={onUnlocked}
                onGetPremium={onGetPremium}
            />

            {/* Paywall Modal */}
            <PaywallModal
                visible={showPaywallModal}
                onClose={onClosePaywall}
                onSuccess={onPaywallSuccess}
            />
        </>
    );
});

StoryModals.displayName = 'StoryModals';
