import React, { useState, useEffect } from 'react';
import { View, Pressable, Alert, ScrollView } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '../atoms/Typography';
import { haptics } from '@/utils/haptics'
import { useTranslation } from 'react-i18next';
import { communityService } from '@/services/communityService';
import { useToastStore } from '@/store/toastStore';

interface PostActionSheetProps {
    sheetRef: React.RefObject<BottomSheet | null>;
    postId: string | null;
    currentUserId: string | null;
    onPostDeleted?: () => void;
    onClose?: () => void;
}

interface ReportReason {
    id: string;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    description: string;
    color: string;
}

export const PostActionSheet: React.FC<PostActionSheetProps> = ({
    sheetRef,
    postId,
    currentUserId,
    onPostDeleted,
    onClose,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const insets = useSafeAreaInsets();
    const toastActions = useToastStore((s) => s.actions);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Check admin status when component mounts or userId changes
    useEffect(() => {
        if (currentUserId) {
            communityService.isAdmin(currentUserId).then(setIsAdmin);
        } else {
            setIsAdmin(false);
        }
    }, [currentUserId]);

    const bottomPadding = insets.bottom + 80; // Tab bar height ~80px

    const REPORT_REASONS: ReportReason[] = [
        {
            id: 'spam',
            icon: 'mail-unread-outline',
            label: t('moderation.spam', 'Spam or Misleading'),
            description: t('moderation.spamDesc', 'Unwanted commercial content or scam'),
            color: theme.colors.warning,
        },
        {
            id: 'harassment',
            icon: 'alert-circle-outline',
            label: t('moderation.harassment', 'Harassment or Hate'),
            description: t('moderation.harassmentDesc', 'Hateful, aggressive or bullying content'),
            color: theme.colors.error,
        },
        {
            id: 'inappropriate',
            icon: 'eye-off-outline',
            label: t('moderation.inappropriate', 'Inappropriate Content'),
            description: t('moderation.inappropriateDesc', 'Adult, violent or disturbing content'),
            color: theme.colors.error,
        },
        {
            id: 'other',
            icon: 'help-circle-outline',
            label: t('moderation.other', 'Something Else'),
            description: t('moderation.otherDesc', 'Other issues not listed above'),
            color: theme.colors.textMuted,
        },
    ];

    const handleOpenReport = () => {
        haptics.selection();
        setShowReportOptions(true);
    };

    const handleSubmitReport = async (reason: ReportReason) => {
        if (!postId || !currentUserId || isSubmitting) return;

        setIsSubmitting(true);
        haptics.success();

        const result = await communityService.reportPost(postId, currentUserId, reason.label);

        if (result.success) {
            toastActions.success(t('moderation.reportSuccess', 'Post reported. Thank you for keeping our community safe.'));
        } else {
            toastActions.error(t('moderation.reportFailed', 'Failed to report post'));
        }

        setIsSubmitting(false);
        setShowReportOptions(false);
        sheetRef.current?.close();
    };

    const handleDelete = () => {
        if (!postId || !currentUserId || !isAdmin) return;

        Alert.alert(
            t('moderation.deletePost', 'Delete Post'),
            t('moderation.deleteConfirm', 'Are you sure you want to delete this post? This action cannot be undone.'),
            [
                { text: t('common.cancel', 'Cancel'), style: 'cancel' },
                {
                    text: t('common.delete', 'Delete'),
                    style: 'destructive',
                    onPress: async () => {
                        haptics.warning();
                        const result = await communityService.deletePost(postId, currentUserId);
                        if (result.success) {
                            toastActions.success(t('moderation.deleteSuccess', 'Post deleted'));
                            onPostDeleted?.();
                        } else {
                            toastActions.error(t('moderation.deleteFailed', 'Failed to delete post'));
                        }
                        sheetRef.current?.close();
                    },
                },
            ]
        );
    };

    const handleClose = () => {
        setShowReportOptions(false);
        onClose?.();
    };

    const renderBackdrop = (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    );

    const snapPoints = showReportOptions ? ['75%'] : (isAdmin ? ['42%'] : ['35%']);

    return (
        <BottomSheet
            ref={sheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={handleClose}
            backdropComponent={renderBackdrop}
            backgroundStyle={{ backgroundColor: theme.colors.surface }}
            handleIndicatorStyle={{ backgroundColor: theme.colors.border }}
        >
            <BottomSheetView style={[styles.content, { paddingBottom: bottomPadding }]}>
                {!showReportOptions ? (
                    // Main Actions
                    <View style={styles.actionsContainer}>
                        <Typography variant="h3" style={styles.title}>
                            {t('moderation.postOptions', 'Post Options')}
                        </Typography>

                        <Pressable style={styles.actionButton} onPress={handleOpenReport}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '15' }]}>
                                <Ionicons name="flag" size={20} color={theme.colors.warning} />
                            </View>
                            <View style={styles.actionTextContainer}>
                                <Typography variant="body" weight="600">
                                    {t('moderation.report', 'Report Post')}
                                </Typography>
                                <Typography variant="caption" color={theme.colors.textMuted}>
                                    {t('moderation.reportHint', 'Flag content that violates our guidelines')}
                                </Typography>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                        </Pressable>

                        {isAdmin && (
                            <Pressable style={styles.actionButton} onPress={handleDelete}>
                                <View style={[styles.iconContainer, { backgroundColor: theme.colors.error + '15' }]}>
                                    <Ionicons name="trash" size={20} color={theme.colors.error} />
                                </View>
                                <View style={styles.actionTextContainer}>
                                    <Typography variant="body" weight="600" color={theme.colors.error}>
                                        {t('moderation.deleteAdmin', 'Delete Post')}
                                    </Typography>
                                    <Typography variant="caption" color={theme.colors.textMuted}>
                                        {t('moderation.deleteHint', 'Permanently remove this post')}
                                    </Typography>
                                </View>
                                <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
                            </Pressable>
                        )}
                    </View>
                ) : (
                    // Report Options
                    <Animated.View entering={FadeIn.duration(200)} style={styles.reportContainer}>
                        <View style={styles.reportHeader}>
                            <Pressable onPress={() => setShowReportOptions(false)} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
                            </Pressable>
                            <Typography variant="h3" style={styles.reportTitle}>
                                {t('moderation.whyReport', 'Why are you reporting?')}
                            </Typography>
                        </View>

                        <Typography variant="caption" color={theme.colors.textMuted} style={styles.reportSubtitle}>
                            {t('moderation.reportIntro', 'Help us understand what\'s wrong with this post.')}
                        </Typography>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.reasonsList}>
                            {REPORT_REASONS.map((reason, index) => (
                                <Animated.View
                                    key={reason.id}
                                    entering={FadeInDown.delay(index * 50).springify()}
                                >
                                    <Pressable
                                        style={[styles.reasonCard, isSubmitting && styles.disabledCard]}
                                        onPress={() => handleSubmitReport(reason)}
                                        disabled={isSubmitting}
                                    >
                                        <View style={[styles.reasonIcon, { backgroundColor: reason.color + '15' }]}>
                                            <Ionicons name={reason.icon} size={24} color={reason.color} />
                                        </View>
                                        <View style={styles.reasonTextContainer}>
                                            <Typography variant="body" weight="600">
                                                {reason.label}
                                            </Typography>
                                            <Typography variant="caption" color={theme.colors.textMuted}>
                                                {reason.description}
                                            </Typography>
                                        </View>
                                    </Pressable>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </Animated.View>
                )}
            </BottomSheetView>
        </BottomSheet>
    );
};

const styles = StyleSheet.create((theme) => ({
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
    },
    actionsContainer: {
        gap: theme.spacing.md,
    },
    title: {
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background,
        gap: theme.spacing.md,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionTextContainer: {
        flex: 1,
    },
    reportContainer: {
        flex: 1,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    backButton: {
        padding: theme.spacing.sm,
        marginRight: theme.spacing.sm,
        marginLeft: -theme.spacing.sm,
    },
    reportTitle: {
        flex: 1,
    },
    reportSubtitle: {
        marginBottom: theme.spacing.lg,
    },
    reasonsList: {
        flex: 1,
    },
    reasonCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.radius.lg,
        backgroundColor: theme.colors.background,
        marginBottom: theme.spacing.sm,
        gap: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    disabledCard: {
        opacity: 0.5,
    },
    reasonIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    reasonTextContainer: {
        flex: 1,
        gap: 2,
    },
}));
