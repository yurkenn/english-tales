import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

interface SectionHeaderProps {
    title: string;
    actionLabel?: string;
    onActionPress?: () => void;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
    title,
    actionLabel = 'See All',
    onActionPress,
}) => {
    const { theme } = useTheme();
    const { containerPadding } = useResponsiveLayout();
    const styles = createStyles(theme, containerPadding);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            {onActionPress && (
                <Pressable onPress={onActionPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Text style={styles.action}>{actionLabel}</Text>
                </Pressable>
            )}
        </View>
    );
};

const createStyles = (theme: Theme, containerPadding: number) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: containerPadding,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.3,
    },
    action: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
});
