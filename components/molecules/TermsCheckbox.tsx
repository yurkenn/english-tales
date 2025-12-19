import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface TermsCheckboxProps {
    checked: boolean;
    onToggle: () => void;
    error?: string;
}

export const TermsCheckbox: React.FC<TermsCheckboxProps> = ({
    checked,
    onToggle,
    error,
}) => {
    const { theme } = useUnistyles();
    const router = useRouter();

    return (
        <View style={styles.container}>
            <Pressable onPress={onToggle} style={styles.checkbox} hitSlop={10}>
                <Ionicons
                    name={checked ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={error ? theme.colors.error : (checked ? theme.colors.primary : theme.colors.textSecondary)}
                />
            </Pressable>
            <View style={styles.textContainer}>
                <Text style={styles.text}>
                    I agree to the{' '}
                    <Text style={styles.link} onPress={() => router.push('/legal/terms')}>
                        Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text style={styles.link} onPress={() => router.push('/legal/privacy')}>
                        Privacy Policy
                    </Text>
                </Text>
                {error && <Text style={styles.error}>{error}</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    checkbox: {
        marginTop: 2,
    },
    textContainer: {
        flex: 1,
    },
    text: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    link: {
        color: theme.colors.primary,
        fontWeight: theme.typography.weight.semibold,
    },
    error: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.error,
        marginTop: theme.spacing.xs,
    },
}));
