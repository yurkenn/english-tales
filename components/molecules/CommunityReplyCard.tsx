import { FC, memo, useCallback } from 'react';
import { View, TouchableOpacity, Image, ImageSourcePropType, StyleSheet, Pressable } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { CommunityReply } from '@/types';
import { haptics } from '@/utils/haptics';
import { useTranslation } from 'react-i18next';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface CommunityReplyCardProps {
    readonly reply: CommunityReply;
    readonly onLike?: () => void;
    readonly onReply?: (replyId: string, userName: string) => void;
    readonly currentUserId?: string;
    readonly isNested?: boolean;
}

export const CommunityReplyCard: FC<CommunityReplyCardProps> = memo(({
    reply,
    onLike,
    onReply,
    currentUserId,
    isNested = false,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { t } = useTranslation();
    const router = useRouter();
    const replyDate = reply.timestamp?.toDate ? reply.timestamp.toDate() : new Date(reply.timestamp);
    const hasLiked = reply.likedBy?.includes(currentUserId || '');
    const avatarSource: ImageSourcePropType = reply.userPhoto ? { uri: reply.userPhoto } : DEFAULT_AVATAR;

    // Check if content starts with @mention
    const mentionMatch = reply.content.match(/^@(\w+\s\w+)/);
    const hasMention = mentionMatch !== null;
    const mentionName = mentionMatch?.[1] || '';
    const contentWithoutMention = hasMention
        ? reply.content.substring(mentionMatch[0].length).trim()
        : reply.content;

    const handleProfilePress = useCallback(() => {
        haptics.selection();
        router.push(`/user/${reply.userId}`);
    }, [reply.userId, router]);

    const handleReplyPress = useCallback(() => {
        haptics.selection();
        onReply?.(reply.id, reply.userName);
    }, [onReply, reply.id, reply.userName]);

    const handleLikePress = useCallback(() => {
        haptics.selection();
        onLike?.();
    }, [onLike]);

    const formatTime = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return t('time.justNow', 'just now');
        if (diffMins < 60) return t('time.minutesAgo', '{{count}}m ago', { count: diffMins });
        if (diffHours < 24) return t('time.hoursAgo', '{{count}}h ago', { count: diffHours });
        if (diffDays < 7) return t('time.daysAgo', '{{count}}d ago', { count: diffDays });
        return date.toLocaleDateString();
    };

    return (
        <View style={[
            styles.container,
            isNested && styles.nestedContainer,
        ]}>
            {isNested && <View style={styles.threadLine} />}

            <TouchableOpacity onPress={handleProfilePress} activeOpacity={0.7}>
                <Image
                    source={avatarSource}
                    style={[styles.avatar, isNested && styles.nestedAvatar]}
                />
            </TouchableOpacity>

            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleProfilePress} style={styles.headerText} activeOpacity={0.7}>
                        <Typography variant="bodyBold" style={styles.userName}>
                            {reply.userName}
                        </Typography>
                        <Typography variant="caption" color={theme.colors.textMuted} style={styles.timestamp}>
                            · {formatTime(replyDate)}
                        </Typography>
                    </TouchableOpacity>
                </View>

                <View style={styles.contentRow}>
                    {hasMention && (
                        <Typography
                            variant="body"
                            color={theme.colors.primary}
                            style={styles.mention}
                        >
                            @{mentionName}
                        </Typography>
                    )}
                    <Typography variant="body" style={styles.content}>
                        {hasMention ? ' ' + contentWithoutMention : reply.content}
                    </Typography>
                </View>

                <View style={styles.actionsRow}>
                    <Pressable
                        onPress={handleLikePress}
                        style={styles.actionButton}
                        hitSlop={8}
                    >
                        <Ionicons
                            name={hasLiked ? "heart" : "heart-outline"}
                            size={16}
                            color={hasLiked ? theme.colors.error : theme.colors.textMuted}
                        />
                        {(reply.likes ?? 0) > 0 && (
                            <Typography
                                variant="caption"
                                color={hasLiked ? theme.colors.error : theme.colors.textMuted}
                                style={styles.actionCount}
                            >
                                {reply.likes}
                            </Typography>
                        )}
                    </Pressable>

                    {!isNested && onReply && (
                        <Pressable
                            onPress={handleReplyPress}
                            style={styles.actionButton}
                            hitSlop={8}
                        >
                            <Ionicons
                                name="chatbubble-outline"
                                size={14}
                                color={theme.colors.textMuted}
                            />
                            <Typography
                                variant="caption"
                                color={theme.colors.textMuted}
                                style={styles.actionText}
                            >
                                {t('social.reply', 'Reply')}
                            </Typography>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
});

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.borderLight,
        },
        nestedContainer: {
            paddingLeft: theme.spacing.lg + 44,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 0,
            paddingVertical: theme.spacing.sm,
        },
        threadLine: {
            position: 'absolute',
            left: theme.spacing.lg + 18,
            top: 0,
            width: 2,
            height: '100%',
            backgroundColor: theme.colors.borderLight,
        },
        avatar: {
            width: 36,
            height: 36,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.borderLight,
        },
        nestedAvatar: {
            width: 28,
            height: 28,
        },
        contentContainer: {
            flex: 1,
            marginLeft: theme.spacing.md,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.xs,
        },
        headerText: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
        },
        userName: {
            fontSize: theme.typography.size.sm,
            fontWeight: '600',
        },
        timestamp: {
            marginLeft: theme.spacing.xs,
            fontSize: theme.typography.size.xs,
        },
        contentRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        mention: {
            fontWeight: '600',
            fontSize: theme.typography.size.md,
        },
        content: {
            fontSize: theme.typography.size.md,
            lineHeight: 20,
            color: theme.colors.text,
            flex: 1,
        },
        actionsRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: theme.spacing.sm,
            gap: theme.spacing.lg,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.xs,
        },
        actionCount: {
            marginLeft: theme.spacing.xs,
            fontSize: theme.typography.size.xs,
        },
        actionText: {
            marginLeft: theme.spacing.xs,
            fontSize: theme.typography.size.xs,
        },
    });
}
