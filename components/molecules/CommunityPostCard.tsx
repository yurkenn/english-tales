import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withSequence
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { haptics } from '@/utils/haptics';

import { CommunityPost } from '@/types';

interface CommunityPostCardProps {
    post: CommunityPost;
    currentUserId?: string | null;
    onLike?: (postId: string) => void;
    onReply?: (postId: string) => void;
    onShare?: (postId: string) => void;
    onMorePress?: (postId: string) => void;
    onAvatarPress?: (userId: string) => void;
}

export const CommunityPostCard: React.FC<CommunityPostCardProps> = ({
    post,
    currentUserId,
    onLike,
    onReply,
    onMorePress,
    onAvatarPress,
}) => {
    const { theme } = useUnistyles();
    const router = useRouter();

    const hasLiked = currentUserId ? post.likedBy?.includes(currentUserId) : false;
    const postDate = post.timestamp?.toDate ? post.timestamp.toDate() : new Date(post.timestamp);
    const isAchievement = post.type === 'achievement' || post.type === 'milestone';
    const achievementTitle = post.metadata?.achievementTitle;

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
            withSpring(1.2, { damping: 10, stiffness: 200 }),
            withSpring(1, { damping: 10, stiffness: 200 })
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
        <View style={[
            styles.postCard,
            isAchievement && styles.achievementCard
        ]}>
            {isAchievement && (
                <View style={styles.achievementBadge}>
                    <Ionicons name="trophy" size={14} color={theme.colors.background} />
                    <Typography variant="caption" style={styles.achievementBadgeText}>
                        {achievementTitle || 'Achievement'}
                    </Typography>
                </View>
            )}
            <View style={styles.postHeader}>
                <Pressable onPress={handleProfilePress}>
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

            <Typography variant="body" style={styles.postContent}>
                {post.content}
            </Typography>

            {post.metadata?.storyTitle && (
                <Pressable
                    style={styles.storyTag}
                    onPress={() => {
                        haptics.selection();
                        if (post.metadata?.storyId) router.push(`/story/${post.metadata.storyId}`);
                    }}
                >
                    <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
                    <Typography variant="caption" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                        {post.metadata.storyTitle}
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
                        style={{ marginLeft: 6 }}
                        color={hasLiked
                            ? (isAchievement ? theme.colors.warning : theme.colors.error)
                            : theme.colors.textMuted
                        }
                    >
                        {isAchievement
                            ? (hasLiked ? 'Congratulated' : 'Congratulate')
                            : (post.likes || 0)
                        }
                        {isAchievement && post.likes > 0 && ` (${post.likes})`}
                    </Typography>
                </Pressable>

                <Pressable style={styles.actionButton} onPress={handleReply}>
                    <Animated.View style={replyAnimationStyle}>
                        <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textMuted} />
                    </Animated.View>
                    <Typography variant="caption" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>
                        {post.replyCount || 0}
                    </Typography>
                </Pressable>

                <Pressable style={styles.actionButton}>
                    <Ionicons name="share-outline" size={20} color={theme.colors.textMuted} />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    postCard: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        borderRadius: 20,
        marginHorizontal: theme.spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
    },
    postHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.background,
    },
    headerInfo: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    postContent: {
        lineHeight: 22,
        marginBottom: theme.spacing.md,
    },
    storyTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary + '08',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.md,
        alignSelf: 'flex-start',
        marginBottom: theme.spacing.md,
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
    achievementCard: {
        borderColor: theme.colors.warning + '40',
        backgroundColor: theme.colors.warning + '05',
        borderWidth: 2,
    },
    achievementBadge: {
        position: 'absolute',
        top: -12,
        right: 20,
        backgroundColor: theme.colors.warning,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        ...theme.shadows.sm,
    },
    achievementBadgeText: {
        color: theme.colors.background,
        fontWeight: 'bold',
        marginLeft: 4,
        fontSize: 10,
    },
}));
