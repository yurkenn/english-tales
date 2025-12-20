import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUnistyles, StyleSheet } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced';

interface LevelOption {
    id: ProficiencyLevel;
    label: string;
    icon: string;
    description: string;
}

const LEVELS: LevelOption[] = [
    { id: 'beginner', label: 'Beginner', icon: '🌱', description: 'Simple words, short sentences' },
    { id: 'intermediate', label: 'Intermediate', icon: '📚', description: 'Everyday vocabulary, complex sentences' },
    { id: 'advanced', label: 'Advanced', icon: '🎓', description: 'Rich vocabulary, literary style' },
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
                    <View style={styles.levelIconContainer}>
                        <Text style={styles.levelIcon}>{level.icon}</Text>
                    </View>
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
        paddingHorizontal: 24,
        gap: 12,
    },
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        borderWidth: 2,
        borderColor: theme.colors.borderLight,
        gap: 12,
    },
    levelCardSelected: {
        borderColor: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
    },
    levelIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    levelIcon: {
        fontSize: theme.typography.size.xxl,
    },
    levelTextContainer: {
        flex: 1,
    },
    levelLabel: {
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 2,
    },
    levelLabelSelected: {
        color: theme.colors.primary,
    },
    levelDescription: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
}));
