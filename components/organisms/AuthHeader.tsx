import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

interface AuthHeaderProps {
    title: string;
    subtitle: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        marginBottom: theme.spacing.xxxxl,
    },
    title: {
        fontSize: theme.typography.size.display,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    subtitle: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
    },
});
