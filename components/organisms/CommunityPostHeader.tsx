import React from 'react';
import { View, TouchableOpacity, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
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
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const avatarSource: ImageSourcePropType = userPhoto ? { uri: userPhoto } : DEFAULT_AVATAR;

    return (
        <View style={styles.postHeader}>
            <TouchableOpacity onPress={onAvatarPress} style={styles.avatarContainer} activeOpacity={0.9}>
                <Image
                    source={avatarSource}
                    style={styles.avatar}
                />
            </TouchableOpacity>

            <TouchableOpacity style={styles.headerInfo} onPress={onAvatarPress} activeOpacity={0.7}>
                <Typography variant="bodyBold">{userName}</Typography>
                <Typography variant="caption" color={theme.colors.textMuted}>
                    {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { haptics.selection(); onMorePress(); }} activeOpacity={0.7}>
                <Ionicons name="ellipsis-horizontal" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
