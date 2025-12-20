import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import Animated from 'react-native-reanimated';
import { Typography } from '../atoms/Typography';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';

interface CommunityPostFooterProps {
    likes: number;
    replyCount: number;
    hasLiked: boolean;
    isAchievement: boolean;
    onLike: () => void;
    onReply: () => void;
    likeAnimationStyle: any;
    replyAnimationStyle: any;
}

export const CommunityPostFooter: React.FC<CommunityPostFooterProps> = ({
    likes,
    replyCount,
    hasLiked,
    isAchievement,
    onLike,
    onReply,
    likeAnimationStyle,
    replyAnimationStyle,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    return (
        <View style={styles.postFooter}>
            <Pressable
                style={styles.actionButton}
                onPress={onLike}
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
                        : (likes || 0)
                    }
                    {isAchievement && likes > 0 && ` (${likes})`}
                </Typography>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={onReply}>
                <Animated.View style={replyAnimationStyle}>
                    <Ionicons name="chatbubble-outline" size={20} color={theme.colors.textMuted} />
                </Animated.View>
                <Typography variant="caption" weight="600" color={theme.colors.textMuted} style={{ marginLeft: 6 }}>
                    {replyCount || 0}
                </Typography>
            </Pressable>

            <Pressable style={styles.actionButton} onPress={() => haptics.selection()}>
                <Ionicons name="share-outline" size={20} color={theme.colors.textMuted} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
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
}));
