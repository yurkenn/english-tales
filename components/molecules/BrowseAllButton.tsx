import { FC } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface BrowseAllButtonProps {
    onPress: () => void;
}

export const BrowseAllButton: FC<BrowseAllButtonProps> = ({ onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons name="library-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.text}>Browse All Stories</Text>
            <Ionicons name="arrow-forward" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
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
