import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface LibraryAnonymousStateProps {
    onSignInPress: () => void;
}

export const LibraryAnonymousState: React.FC<LibraryAnonymousStateProps> = ({
    onSignInPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.container}>
            <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.title}>Sign in to save books</Text>
            <Text style={styles.subtitle}>
                Create an account to save books and track your reading progress
            </Text>
            <Pressable style={styles.signInButton} onPress={onSignInPress}>
                <Text style={styles.signInButtonText}>Sign In</Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    subtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    signInButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
        marginTop: theme.spacing.md,
    },
    signInButtonText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
    },
}));
