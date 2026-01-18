import { memo, useCallback, FC } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Typography } from '@/components/atoms/Typography';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { haptics } from '@/utils/haptics';
import { UserStoryReview } from '@/services/userStoryReviewService';

interface UserStoryReviewCardProps {
    review: UserStoryReview;
    isOwn?: boolean;
    onEdit?: () => void;
    onDelete?: () => void;
    onHelpful?: () => void;
}

const StarDisplay: FC<{ rating: number; size?: number }> = memo(({ rating, size = 14 }) => {
    return (
        <View style={{ flexDirection: 'row', gap: 2 }}>
            {[1, 2, 3, 4, 5].map((star) => (
                <Feather
                    key={star}
                    name="star"
                    size={size}
                    color={star <= rating ? '#FFB800' : '#E0E0E0'}
                />
            ))}
        </View>
    );
});

export const UserStoryReviewCard: FC<UserStoryReviewCardProps> = memo(
    ({ review, isOwn = false, onEdit, onDelete, onHelpful }) => {
        const { theme } = useTheme();
        const styles = createStyles(theme);

        const formatDate = useCallback((date: Date) => {
            const now = new Date();
            const diffMs = now.getTime() - date.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return `${diffDays} days ago`;
            if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
            return date.toLocaleDateString();
        }, []);

        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        {review.userAvatar ? (
                            <Image source={{ uri: review.userAvatar }} style={styles.avatar} contentFit="cover" />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.border }]}>
                                <Feather name="user" size={14} color={theme.colors.textMuted} />
                            </View>
                        )}
                        <View style={styles.userDetails}>
                            <Typography variant="body" weight="medium" numberOfLines={1}>
                                {review.userName}
                            </Typography>
                            <Typography variant="caption" color={theme.colors.textMuted}>
                                {formatDate(review.createdAt)}
                            </Typography>
                        </View>
                    </View>

                    <View style={styles.ratingContainer}>
                        <StarDisplay rating={review.rating} />
                    </View>
                </View>

                {review.content && (
                    <Typography variant="body" color={theme.colors.textSecondary} style={styles.content}>
                        {review.content}
                    </Typography>
                )}

                <View style={styles.footer}>
                    {!isOwn && onHelpful && (
                        <Pressable
                            onPress={() => {
                                haptics.selection();
                                onHelpful();
                            }}
                            style={styles.helpfulButton}
                        >
                            <Feather name="thumbs-up" size={14} color={theme.colors.textMuted} />
                            <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>
                                Helpful {review.helpful > 0 ? `(${review.helpful})` : ''}
                            </Typography>
                        </Pressable>
                    )}

                    {isOwn && (
                        <View style={styles.ownActions}>
                            {onEdit && (
                                <Pressable
                                    onPress={() => {
                                        haptics.selection();
                                        onEdit();
                                    }}
                                    style={styles.actionButton}
                                >
                                    <Feather name="edit-2" size={14} color={theme.colors.primary} />
                                    <Typography variant="caption" color={theme.colors.primary} style={{ marginLeft: 4 }}>
                                        Edit
                                    </Typography>
                                </Pressable>
                            )}
                            {onDelete && (
                                <Pressable
                                    onPress={() => {
                                        haptics.selection();
                                        onDelete();
                                    }}
                                    style={styles.actionButton}
                                >
                                    <Feather name="trash-2" size={14} color={theme.colors.error} />
                                    <Typography variant="caption" color={theme.colors.error} style={{ marginLeft: 4 }}>
                                        Delete
                                    </Typography>
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>
            </View>
        );
    }
);

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 16,
            marginBottom: 12,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 12,
        },
        userInfo: {
            flexDirection: 'row',
            alignItems: 'center',
            flex: 1,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: 18,
        },
        avatarPlaceholder: {
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
        },
        userDetails: {
            marginLeft: 10,
            flex: 1,
        },
        ratingContainer: {
            marginLeft: 8,
        },
        content: {
            lineHeight: 22,
            marginBottom: 12,
        },
        footer: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        helpfulButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
            backgroundColor: theme.colors.background,
            borderRadius: 12,
        },
        ownActions: {
            flexDirection: 'row',
            gap: 16,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 10,
        },
    });
}
