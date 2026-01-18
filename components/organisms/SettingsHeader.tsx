import { FC, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface SettingsHeaderProps {
    readonly title: string;
    readonly onBackPress: () => void;
}

export const SettingsHeader: FC<SettingsHeaderProps> = ({
    title,
    onBackPress,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handleBackPress = useCallback(() => {
        onBackPress();
    }, [onBackPress]);

    return (
        <View style={styles.header}>
            <Pressable
                style={({ pressed }) => [
                    styles.backButton,
                    pressed && { opacity: 0.7 }
                ]}
                onPress={handleBackPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={styles.placeholder} />
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        zIndex: 100,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
});
