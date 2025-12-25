import React from 'react';
import { View, Pressable, Image, ImageSourcePropType } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { haptics } from '@/utils/haptics';

// Default mascot avatar for users without profile photo
const DEFAULT_AVATAR = require('@/assets/defaultavatar.png');

interface CreatePostBarProps {
    userPhotoUrl?: string | null;
    placeholder: string;
    onPress: () => void;
    onImagePress?: () => void;
}

export const CreatePostBar: React.FC<CreatePostBarProps> = ({
    userPhotoUrl,
    placeholder,
    onPress,
    onImagePress,
}) => {
    const { theme } = useUnistyles();
    const avatarSource: ImageSourcePropType = userPhotoUrl ? { uri: userPhotoUrl } : DEFAULT_AVATAR;

    return (
        <View style={styles.createPostBar}>
            <View style={styles.avatarWrapper}>
                <Image
                    source={avatarSource}
                    style={styles.myAvatar}
                />
            </View>

            <Pressable
                style={styles.inputPlaceholder}
                onPress={() => { haptics.selection(); onPress(); }}
            >
                <Typography color={theme.colors.textMuted}>
                    {placeholder}
                </Typography>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    createPostBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    avatarWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        padding: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    myAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 17,
    },
    inputPlaceholder: {
        flex: 1,
        height: 38,
        backgroundColor: theme.colors.background,
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        marginLeft: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    imageAction: {
        padding: 4,
    },
}));
