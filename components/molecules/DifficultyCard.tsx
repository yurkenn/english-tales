import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

interface DifficultyCardProps {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    storyCount: number;
    onPress: () => void;
}

const DIFFICULTY_CONFIG = {
    beginner: {
        label: 'Easy',
        icon: 'leaf-outline' as const,
        colors: ['#10B981', '#059669'] as [string, string],
        description: 'Perfect for beginners',
    },
    intermediate: {
        label: 'Medium',
        icon: 'flash-outline' as const,
        colors: ['#F59E0B', '#D97706'] as [string, string],
        description: 'Challenge yourself',
    },
    advanced: {
        label: 'Hard',
        icon: 'flame-outline' as const,
        colors: ['#EF4444', '#DC2626'] as [string, string],
        description: 'For advanced readers',
    },
};

export const DifficultyCard: React.FC<DifficultyCardProps> = ({
    difficulty,
    storyCount,
    onPress,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    const DIFFICULTY_CONFIG = {
        beginner: {
            label: t('common.difficulty.easy', 'Easy'),
            icon: 'leaf-outline' as const,
            colors: ['#10B981', '#059669'] as [string, string],
            description: t('common.difficulty.easyDesc', 'Perfect for beginners'),
        },
        intermediate: {
            label: t('common.difficulty.medium', 'Medium'),
            icon: 'flash-outline' as const,
            colors: ['#F59E0B', '#D97706'] as [string, string],
            description: t('common.difficulty.mediumDesc', 'Challenge yourself'),
        },
        advanced: {
            label: t('common.difficulty.hard', 'Hard'),
            icon: 'flame-outline' as const,
            colors: ['#EF4444', '#DC2626'] as [string, string],
            description: t('common.difficulty.hardDesc', 'For advanced readers'),
        },
    };

    const config = DIFFICULTY_CONFIG[difficulty];

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && styles.pressed,
            ]}
            onPress={onPress}
        >
            <LinearGradient
                colors={config.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradient}
            >
                <View style={styles.iconContainer}>
                    <Ionicons
                        name={config.icon}
                        size={28}
                        color="rgba(255,255,255,0.9)"
                    />
                </View>
                <Text style={styles.label}>{config.label}</Text>
                <Text style={styles.count}>
                    {storyCount} {storyCount === 1 ? t('authors.story', 'story') : t('authors.stories', 'stories')}
                </Text>
            </LinearGradient>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    pressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    gradient: {
        padding: theme.spacing.md,
        height: 110,
        justifyContent: 'space-between',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: theme.radius.lg,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        marginTop: theme.spacing.xs,
    },
    count: {
        fontSize: theme.typography.size.sm,
        color: 'rgba(255,255,255,0.85)',
        fontWeight: theme.typography.weight.medium,
    },
}));
