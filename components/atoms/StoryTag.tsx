import React from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Typography } from './Typography';
import { haptics } from '@/utils/haptics';

interface StoryTagProps {
    title: string;
    onPress: () => void;
}

export const StoryTag: React.FC<StoryTagProps> = ({ title, onPress }) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            style={styles.storyTag}
            onPress={() => {
                haptics.selection();
                onPress();
            }}
        >
            <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
            <Typography variant="caption" weight="600" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                {title}
            </Typography>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
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
}));
