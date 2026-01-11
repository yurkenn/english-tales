import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';

interface AuthDividerProps {
    text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'or continue with' }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    return (
        <View style={styles.container}>
            <View style={styles.line} />
            <Text style={styles.text}>{text}</Text>
            <View style={styles.line} />
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: theme.spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    text: {
        marginHorizontal: theme.spacing.lg,
        color: theme.colors.textMuted,
        fontSize: theme.typography.size.sm,
    },
});
