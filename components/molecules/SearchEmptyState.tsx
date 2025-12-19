import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface SearchEmptyStateProps {
    type: 'min-chars' | 'loading' | 'no-results';
}

export const SearchEmptyState: React.FC<SearchEmptyStateProps> = ({ type }) => {
    const { theme } = useUnistyles();

    if (type === 'loading') {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.subtitle}>Searching...</Text>
            </View>
        );
    }

    if (type === 'min-chars') {
        return (
            <View style={styles.container}>
                <Text style={styles.subtitle}>
                    Type at least 2 characters to search
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Ionicons
                name="document-text-outline"
                size={64}
                color={theme.colors.textMuted}
            />
            <Text style={styles.title}>No results found</Text>
            <Text style={styles.subtitle}>Try a different search term</Text>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xxxl,
        gap: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
}));
