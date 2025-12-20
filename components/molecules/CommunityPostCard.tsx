import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence,
    FadeInDown,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { RatingStars } from '../atoms/RatingStars';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

import { CommunityPost } from '@/types';

interface CommunityPostCardProps {
    post: CommunityPost;
    currentUserId?: string | null;
    onLike?: (postId: string) => void;
    onReply?: (postId: string) => void;
    onShare?: (postId: string) => void;
    onMorePress?: (postId: string) => void;
    onAvatarPress?: (userId: string) => void;
    index?: number;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
    post,
    currentUserId,
    onLike,
    onReply,
    onMorePress,
    onAvatarPress,
    index = 0,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();
    const router = useRouter();

    const hasLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;
    const postDate = post.timestamp?.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
    const isAchievement = post.type === 'achievement' || post.type === 'milestone';
    const isReview = post.type === 'story_review';

    const achievementTitle = post.metadata?.achievementTitle;
    const storyTitle = post.metadata?.storyTitle;
    const rating = post.metadata?.rating;

    const likeScale = useSharedValue(1);
    const replyScale = useSharedValue(1);

    const likeAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: likeScale.value }]
    }));

    const replyAnimationStyle = useAnimatedStyle(() => ({
        transform: [{ scale: replyScale.value }]
    }));

    const handleLike = () => {
        likeScale.value = withSequence(
            withSpring(1.4, { damping: 12, stiffness: 200 }),
            withSpring(1, { damping: 12, stiffness: 200 })
        );
        onLike?.(post.id);
    };

    const handleReply = () => {
        replyScale.value = withSequence(
            withSpring(1.2, { damping: 10, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 200 })
        );
        onReply?.(post.id);
    };

    const handleProfilePress = () => {
        haptics.selection();
        if (onAvatarPress) {
            onAvatarPress(post.userId);
        } else {
            router.push(`/user/${post.userId}`);
        }
    };

    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            style={[
                styles.postCard,
                isAchievement && { borderColor: theme.colors.warning + '20' },
                isReview && { borderColor: theme.colors.primary + '20' }
            ]}
        >
            {isAchievement && (
                <View style={styles.achievementBadge}>
                    <Ionicons name="trophy" size={10} color="#FFFFFF" />
                    <Typography variant="caption" weight="700" style={styles.achievementBadgeText}>
                        {achievementTitle || t('social.achievement', 'Achievement')}
                    </Typography>
                </View>
            )}
            {isReview && (
                <View style={styles.reviewBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Typography variant="caption" weight="700" style={styles.reviewBadgeText}>
                        {t('reading.review', 'Story Review')}
                    </Typography>
                </View>
            )}

            <View style={styles.postHeader}>
                <Pressable onPress={handleProfilePress} style={styles.avatarContainer}>
                    <OptimizedImage
                        source={{ uri: post.userPhoto || '' }}
                        style={styles.avatar}
                        placeholder="person-circle"
                    />
                </Pressable>
                <Pressable style={styles.headerInfo} onPress={handleProfilePress}>
                    <Typography variant="bodyBold">{post.userName}</Typography>
                    <Typography variant="caption" color={theme.colors.textMuted}>
                        {postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Typography>
                </Pressable>
                <Pressable onPress={() => { haptics.selection(); onMorePress?.(post.id); }}>
                    <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
                </Pressable>
            </View>

            {isReview && rating && (
                <View style={styles.ratingRow}>
                    <RatingStars rating={rating} size="sm" />
                </View>
            )}

            <Typography variant="body" style={styles.postContent}>
                {post.content}
            </Typography>

            {storyTitle && (
                <Pressable
                    style={styles.storyTag}
                    onPress={() => {
                        haptics.selection();
                        if (post.metadata?.storyId) router.push(`/story/${post.metadata.storyId}`);
                    }}
                >
                    <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
                    <Typography variant="caption" weight="600" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                        {storyTitle}
                    </Typography>
                </Pressable>
            )}

            <View style={styles.postFooter}>
                <Pressable
                    style={styles.actionButton}
                    onPress={handleLike}
                >
                    <Animated.View style={likeAnimationStyle}>
                        <Ionicons
                            name={isAchievement
                                ? (hasLiked ? "star" : "star-outline")
                                : (hasLiked ? "heart" : "heart-outline")
                            }
                            size={22}
                            color={hasLiked
                                ? (isAchievement ? theme.colors.warning : theme.colors.error)
                                : theme.colors.textMuted
                            }
                        />
                    </Animated.View>
                    <Typography
                        variant="caption"
                        weight="600"
                        style={{ marginLeft: 6 }}
                        color={hasLiked
                            ? (isAchievement ? theme.colors.warning : theme.colors.error)
                            : theme.colors.textMuted
                        }
                    >
                        {isAchievement
                            ? (hasLiked ? t('social.congratulated', 'Congratulated') : t('social.congratulate', 'Congratulate'))
                            : (post.likes || 0)
                        }
                        {isAchievement && post.likes > 0 && ` (${post.likes})`}
                    </Typography>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={handleReply}>
                    <Animated.View style={replyAnimationStyle}>
                        <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textMuted} />
                    </Animated.View>
                    <Typography variant="caption" weight="600" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>
                        {post.replyCount || 0}
                    </Typography>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={() => haptics.selection()}>
                    <Ionicons name="share-outline" size={20} color={theme.colors.textMuted} />
                </Pressable>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    postCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        borderRadius: 16,
        marginHorizontal: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    avatarContainer: {
        padding: 1.5,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    headerInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    postContent: {
        lineHeight: 22,
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
        fontSize: 15,
    },
    storyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    postFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        paddingTop: theme.spacing.md,
        gap: theme.spacing.xl,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    achievementBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.warning,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 12,
        zIndex: 1,
    },
    achievementBadgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    reviewBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: theme.colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderTopRightRadius: 15,
        borderBottomLeftRadius: 12,
        zIndex: 1,
    },
    reviewBadgeText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ratingRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
}));
