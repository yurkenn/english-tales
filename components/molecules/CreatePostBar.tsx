import { FC } from 'react';
import { View, TouchableOpacity, Image, ImageSourcePropType, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
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

export const CreatePostBar: FC<CreatePostBarProps> = ({
    userPhotoUrl,
    placeholder,
    onPress,
    onImagePress,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const avatarSource: ImageSourcePropType = userPhotoUrl ? { uri: userPhotoUrl } : DEFAULT_AVATAR;

    return (
        <View style={styles.createPostBar}>
            <View style={styles.avatarWrapper}>
                <Image
                    source={avatarSource}
                    style={styles.myAvatar}
                />
            </View>

            <TouchableOpacity
                style={styles.inputPlaceholder}
                activeOpacity={0.7}
                onPress={() => { haptics.selection(); onPress(); }}
            >
                <Typography color={theme.colors.textMuted}>
                    {placeholder}
                </Typography>
            </TouchableOpacity>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    createPostBar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    avatarWrapper: {
        width: 36,
        height: 36,
        borderRadius: theme.radius.full,
        padding: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    myAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: theme.radius.full,
    },
    inputPlaceholder: {
        flex: 1,
        height: 38,
        backgroundColor: theme.colors.background,
        borderRadius: theme.radius.sm,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        marginLeft: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    imageAction: {
        padding: theme.spacing.xs,
    },
});
