import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ConfettiCelebration } from './ConfettiCelebration';
import { RewardedAdButton } from '../molecules/RewardedAdButton';
import { haptics } from '@/utils/haptics';
import { useToastStore } from '@/store/toastStore';

interface CompletionModalProps {
    visible: boolean;
    storyTitle: string;
    readingTimeMinutes: number;
    wordCount: number;
    onComplete: (rating?: number) => void;
    onContinue: () => void;
}

export const CompletionModal: React.FC<CompletionModalProps> = ({
    visible,
    storyTitle,
    readingTimeMinutes,
    wordCount,
    onComplete,
    onContinue,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);
    const toastActions = useToastStore((s) => s.actions);

    const handleRatingPress = (value: number) => {
        haptics.selection();
        setRating(value);
    };

    const handleAdRewardEarned = () => {
        toastActions.success(t('ads.rewardEarned', 'Reward earned! Next story unlocked.'));
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onContinue}>
            <ConfettiCelebration visible={visible} />
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="trophy" size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.title}>{t('reading.completion.title')}</Text>
                        <Text style={styles.congratsText}>{t('reading.completion.subtitle')}</Text>
                    </View>

                    <Text style={styles.storyTitle}>{storyTitle}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{readingTimeMinutes}</Text>
                            <Text style={styles.statLabel}>{t('common.min')}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statBox}>
                            <Text style={styles.statValue}>{wordCount}</Text>
                            <Text style={styles.statLabel}>{t('common.words')}</Text>
                        </View>
                    </View>

                    <View style={styles.ratingSection}>
                        <Text style={styles.ratingLabel}>{t('reading.completion.ratingOptional')}</Text>
                        <View style={styles.stars}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Pressable key={star} onPress={() => handleRatingPress(star)}>
                                    <Ionicons
                                        name={star <= rating ? 'star' : 'star-outline'}
                                        size={32}
                                        color={star <= rating ? theme.colors.warning : theme.colors.textMuted}
                                    />
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.readyText}>{t('reading.completion.readyForMore')}</Text>

                        {/* Rewarded Ad Option */}
                        <View style={styles.adButtonContainer}>
                            <RewardedAdButton
                                rewardType="story_unlock"
                                buttonText={t('ads.watchForNextStory', 'Watch ad for bonus')}
                                rewardDescription={t('ads.unlockNextFree', 'Unlock next story free')}
                                onRewardEarned={handleAdRewardEarned}
                                variant="outline"
                                size="md"
                            />
                        </View>

                        <Pressable
                            style={styles.button}
                            onPress={() => {
                                haptics.success();
                                onComplete(rating > 0 ? rating : undefined);
                            }}
                        >
                            <Text style={styles.buttonText}>{t('reading.completion.nextStory')}</Text>
                            <Ionicons name="arrow-forward" size={20} color={theme.colors.textInverse} />
                        </Pressable>

                        <Pressable style={styles.secondary} onPress={onContinue}>
                            <Text style={styles.secondaryText}>{t('reading.completion.backToHome')}</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};


const styles = StyleSheet.create((theme) => ({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
    },
    content: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: theme.spacing.xxxxl,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: theme.radius.full,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    congratsText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
        textAlign: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.xxs,
        marginBottom: theme.spacing.sm,
    },
    storyTitle: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: theme.spacing.xl,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: theme.radius.xl,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        marginBottom: theme.spacing.xxxxl,
        width: '100%',
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        marginTop: theme.spacing.xxs,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: theme.colors.borderLight,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: theme.spacing.xxxxl,
    },
    ratingLabel: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: 12,
    },
    stars: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    readyText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    button: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.lg,
        paddingHorizontal: theme.spacing.xl,
        borderRadius: theme.radius.full,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        ...theme.shadows.md,
    },
    buttonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
    secondary: {
        padding: 8,
    },
    secondaryText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
        fontWeight: theme.typography.weight.medium,
    },
    adButtonContainer: {
        width: '100%',
    },
}));
