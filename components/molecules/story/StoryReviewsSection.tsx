import { FC, memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';

import { ReviewCard } from '../ReviewCard';

interface Review {
    userName: string;
    userPhoto?: string;
    rating: number;
    comment: string;
}

interface StoryReviewsSectionProps {
    storyId: string;
    reviews: Review[];
    isLoggedIn: boolean;
    onWriteReview: () => void;
}

export const StoryReviewsSection: FC<StoryReviewsSectionProps> = memo(({
    storyId,
    reviews,
    isLoggedIn,
    onWriteReview,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('stories.details.reviews')}</Text>
                <TouchableOpacity onPress={() => router.push(`/reviews/${storyId}`)} activeOpacity={0.7}>
                    <Text style={styles.seeAllLink}>{t('stories.details.seeAll')}</Text>
                </TouchableOpacity>
            </View>

            {reviews.length > 0 ? (
                <ReviewCard
                    userName={reviews[0].userName}
                    userAvatar={reviews[0].userPhoto || undefined}
                    rating={reviews[0].rating}
                    text={reviews[0].comment}
                />
            ) : (
                <Text style={styles.noReviewsText}>{t('stories.details.noReviews')}</Text>
            )}

            {isLoggedIn && (
                <TouchableOpacity
                    style={styles.writeReviewButton}
                    onPress={onWriteReview}
                    activeOpacity={0.7}
                >
                    <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.writeReviewText}>{t('stories.details.writeReview')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
});

StoryReviewsSection.displayName = 'StoryReviewsSection';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        section: {
            gap: theme.spacing.md,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        sectionTitle: {
            fontSize: theme.typography.size.xl,
            fontWeight: theme.typography.weight.bold,
            color: theme.colors.text,
        },
        seeAllLink: {
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.bold,
            color: theme.colors.primary,
        },
        noReviewsText: {
            fontSize: theme.typography.size.md,
            color: theme.colors.textMuted,
            textAlign: 'center',
            paddingVertical: theme.spacing.xl,
        },
        writeReviewButton: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.spacing.xs,
            paddingVertical: theme.spacing.md,
            marginTop: theme.spacing.md,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            ...theme.shadows.sm,
        },
        writeReviewText: {
            fontSize: theme.typography.size.md,
            fontWeight: theme.typography.weight.bold,
            color: theme.colors.primary,
        },
    });
}
