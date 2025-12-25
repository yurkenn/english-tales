import React from 'react';
import { View, Pressable, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { haptics } from '@/utils/haptics';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface CommunityPostHeaderProps {
    userName: string;
    userPhoto: string | null;
    timestamp: Date;
    onAvatarPress: () => void;
    onMorePress: () => void;
}

export const CommunityPostHeader: React.FC<CommunityPostHeaderProps> = ({
    userName,
    userPhoto,
    timestamp,
    onAvatarPress,
    onMorePress,
}) => {
    const { theme } = useUnistyles();
    const avatarSource: ImageSourcePropType = userPhoto ? { uri: userPhoto } : DEFAULT_AVATAR;

    return (
        <View style={styles.postHeader}>
            <Pressable onPress={onAvatarPress} style={styles.avatarContainer}>
                <Image
                    source={avatarSource}
                    style={styles.avatar}
                />
            </Pressable>

            <Pressable style={styles.headerInfo} onPress={onAvatarPress}>
                <Typography variant="bodyBold">{userName}</Typography>
                <Typography variant="caption" color={theme.colors.textMuted}>
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </Pressable>
            <Pressable onPress={() => { haptics.selection(); onMorePress(); }}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
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
}));
