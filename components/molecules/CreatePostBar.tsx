import React from 'react';
import { View, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../atoms/Typography';
import { OptimizedImage } from '../atoms/OptimizedImage';
import { haptics } from '@/utils/haptics';

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

    return (
        <View style={styles.createPostBar}>
            <View style={styles.avatarWrapper}>
                <OptimizedImage
                    source={{ uri: userPhotoUrl || '' }}
                    style={styles.myAvatar}
                    placeholder="person-circle"
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
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
        marginBottom: theme.spacing.md,
    },
    avatarWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        padding: 2,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
    myAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    inputPlaceholder: {
        flex: 1,
        height: 40,
        backgroundColor: theme.colors.borderLight,
        borderRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.md,
        marginHorizontal: theme.spacing.md,
    },
    imageAction: {
        padding: 4,
    },
}));
