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
import { AchievementBadge } from '../atoms/AchievementBadge';
import { StoryTag } from '../atoms/StoryTag';
import { CommunityPostHeader } from './CommunityPostHeader';
import { CommunityPostFooter } from './CommunityPostFooter';
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
    onPress?: () => void;
    index?: number;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
    post,
    currentUserId,
    onLike,
    onReply,
    onMorePress,
    onAvatarPress,
    onPress,
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
        <Pressable
            onPress={() => {
                haptics.selection();
                onPress?.();
            }}
            style={[
                styles.postCard,
                isAchievement && { borderColor: theme.colors.warning + '20' },
                isReview && { borderColor: theme.colors.primary + '20' }
            ]}
        >


            {isAchievement && (
                <AchievementBadge title={achievementTitle || t('social.achievement', 'Achievement')} />
            )}

            {isReview && (
                <View style={styles.reviewBadge}>
                    <Ionicons name="star" size={10} color="#FFFFFF" />
                    <Typography variant="caption" weight="700" style={styles.reviewBadgeText}>
                        {t('reading.review', 'Story Review')}
                    </Typography>
                </View>
            )}

            <CommunityPostHeader
                userName={post.userName}
                userPhoto={post.userPhoto}
                timestamp={postDate}
                onAvatarPress={handleProfilePress}
                onMorePress={() => onMorePress?.(post.id)}
            />

            {
                isReview && rating && (
                    <View style={styles.ratingRow}>
                        <RatingStars rating={rating} size="sm" />
                    </View>
                )
            }

            <Typography variant="body" style={styles.postContent}>
                {post.content}
            </Typography>

            {
                storyTitle && (
                    <StoryTag
                        title={storyTitle}
                        onPress={() => {
                            if (post.metadata?.storyId) router.push(`/story/${post.metadata.storyId}`);
                        }}
                    />
                )
            }

            <CommunityPostFooter
                likes={post.likes || 0}
                replyCount={post.replyCount || 0}
                hasLiked={hasLiked}
                isAchievement={isAchievement}
                onLike={handleLike}
                onReply={handleReply}
                likeAnimationStyle={likeAnimationStyle}
                replyAnimationStyle={replyAnimationStyle}
            />
        </Pressable>

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
        fontSize: theme.typography.size.md,
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
        fontSize: theme.typography.size.xs,
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
        fontSize: theme.typography.size.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    ratingRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.sm,
    },
}));
