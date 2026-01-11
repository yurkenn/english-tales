import React from 'react';
import { Text, Pressable , StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface BrowseAllButtonProps {
    onPress: () => void;
}

export const BrowseAllButton: React.FC<BrowseAllButtonProps> = ({ onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <Pressable
            style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
            ]}
            onPress={onPress}
        >
            <Ionicons name="library-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.text}>Browse All Stories</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
        </Pressable>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
        backgroundColor: `${theme.colors.primary}10`,
        borderRadius: theme.radius.xl,
        borderWidth: 1.5,
        borderColor: `${theme.colors.primary}30`,
        gap: theme.spacing.sm,
    },
    buttonPressed: {
        backgroundColor: `${theme.colors.primary}20`,
    },
    text: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
});
