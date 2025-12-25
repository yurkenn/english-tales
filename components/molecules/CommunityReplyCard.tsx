import React from 'react';
import { View, Pressable, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { CommunityReply } from '@/types';
import { haptics } from '@/utils/haptics';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface CommunityReplyCardProps {
    reply: CommunityReply;
    onLike?: () => void;
    currentUserId?: string;
}

export const CommunityReplyCard: React.FC<CommunityReplyCardProps> = ({ reply, onLike, currentUserId }) => {
    const { theme } = useUnistyles();
    const router = useRouter();
    const replyDate = reply.timestamp?.toDate ? reply.timestamp.toDate() : new Date(reply.timestamp);
    const hasLiked = reply.likedBy?.includes(currentUserId || '');
    const avatarSource: ImageSourcePropType = reply.userPhoto ? { uri: reply.userPhoto } : DEFAULT_AVATAR;

    const handleProfilePress = () => {
        haptics.selection();
        router.push(`/user/${reply.userId}`);
    };

    return (
        <View style={styles.container}>
            <Pressable onPress={handleProfilePress}>
                <Image
                    source={avatarSource}
                    style={styles.avatar}
                />
            </Pressable>

            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Pressable onPress={handleProfilePress} style={styles.headerText}>
                        <Typography variant="bodyBold" style={styles.userName}>
                            {reply.userName}
                        </Typography>
                        <Typography variant="caption" color={theme.colors.textMuted} style={styles.timestamp}>
                            {replyDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </Pressable>
                    <Pressable
                        onPress={() => { haptics.selection(); onLike?.(); }}
                        style={styles.likeButton}
                    >
                        <Ionicons
                            name={hasLiked ? "heart" : "heart-outline"}
                            size={16}
                            color={hasLiked ? theme.colors.error : theme.colors.textMuted}
                        />
                        {reply.likes ? (
                            <Typography variant="caption" color={hasLiked ? theme.colors.error : theme.colors.textMuted} style={{ marginLeft: 4 }}>
                                {reply.likes}
                            </Typography>
                        ) : null}
                    </Pressable>
                </View>
                <Typography variant="body" style={styles.content}>
                    {reply.content}
                </Typography>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.colors.borderLight,
    },
    contentContainer: {
        flex: 1,
        marginLeft: theme.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    headerText: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    userName: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
    },
    timestamp: {
        marginLeft: theme.spacing.sm,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        paddingVertical: 4,
    },
    content: {
        fontSize: theme.typography.size.md,
        lineHeight: 20,
        color: theme.colors.text,
    },
}));
