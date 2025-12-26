import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

interface LevelOption {
    id: ProficiencyLevel;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    description: string;
    colors: [string, string];
}

const LEVELS: LevelOption[] = [
    {
        id: 'beginner',
        label: 'Beginner',
        icon: 'leaf',
        description: 'Simple words, short sentences',
        colors: ['#22C55E', '#16A34A'],
    },
    {
        id: 'intermediate',
        label: 'Intermediate',
        icon: 'library',
        description: 'Everyday vocabulary, complex sentences',
        colors: ['#3B82F6', '#2563EB'],
    },
    {
        id: 'advanced',
        label: 'Advanced',
        icon: 'school',
        description: 'Rich vocabulary, literary style',
        colors: ['#A855F7', '#9333EA'],
    },
];

interface OnboardingLevelSelectionProps {
    selectedLevel: ProficiencyLevel;
    onSelectLevel: (level: ProficiencyLevel) => void;
}

export const OnboardingLevelSelection = ({
    selectedLevel,
    onSelectLevel,
}: OnboardingLevelSelectionProps) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.levelContainer}>
            {LEVELS.map((level) => (
                <Pressable
                    key={level.id}
                    style={[
                        styles.levelCard,
                        selectedLevel === level.id && styles.levelCardSelected,
                    ]}
                    onPress={() => onSelectLevel(level.id)}
                >
                    <LinearGradient
                        colors={level.colors}
                        style={styles.levelIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name={level.icon} size={24} color="#FFFFFF" />
                    </LinearGradient>
                    <View style={styles.levelTextContainer}>
                        <Text style={[
                            styles.levelLabel,
                            selectedLevel === level.id && styles.levelLabelSelected,
                        ]}>
                            {level.label}
                        </Text>
                        <Text style={styles.levelDescription}>{level.description}</Text>
                    </View>
                    {selectedLevel === level.id && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                    )}
                </Pressable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    levelContainer: {
        width: '100%',
        paddingHorizontal: theme.spacing.xxl,
        gap: theme.spacing.md,
    },
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        gap: theme.spacing.md,
    },
    levelCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    levelIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    levelTextContainer: {
        flex: 1,
    },
    levelLabel: {
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xxs,
    },
    levelLabelSelected: {
        color: theme.colors.primary,
    },
    levelDescription: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
}));
