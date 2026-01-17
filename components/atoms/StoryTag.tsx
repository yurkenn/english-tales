import { FC } from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Theme } from '@/theme';
import { Typography } from './Typography';
import { haptics } from '@/utils/haptics';

interface StoryTagProps {
    title: string;
    onPress: () => void;
}

export const StoryTag: FC<StoryTagProps> = ({ title, onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity
            style={styles.storyTag}
            activeOpacity={0.7}
            onPress={() => {
                haptics.selection();
                onPress();
            }}
        >
            <Ionicons name="book-outline" size={16} color={theme.colors.primary} />
            <Typography variant="caption" weight="600" color={theme.colors.primary} style={{ marginLeft: 6 }}>
                {title}
            </Typography>
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
