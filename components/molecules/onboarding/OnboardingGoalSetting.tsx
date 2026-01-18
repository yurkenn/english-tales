/**
 * OnboardingGoalSetting - Daily Reading Goal Selection
 */
import { FC, memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface GoalOption {
    minutes: number;
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const GOAL_OPTIONS: GoalOption[] = [
    { minutes: 5, label: '5 min', description: 'Quick read', icon: 'flash' },
    { minutes: 10, label: '10 min', description: 'Easy start', icon: 'cafe' },
    { minutes: 15, label: '15 min', description: 'Recommended', icon: 'star' },
    { minutes: 30, label: '30 min', description: 'Deep dive', icon: 'rocket' },
];

interface OnboardingGoalSettingProps {
    readonly selectedGoal: number;
    readonly onSelectGoal: (minutes: number) => void;
}

export const OnboardingGoalSetting: FC<OnboardingGoalSettingProps> = memo(({
    selectedGoal,
    onSelectGoal,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handleSelect = useCallback((minutes: number) => {
        haptics.selection();
        onSelectGoal(minutes);
    }, [onSelectGoal]);

    return (
        <View style={styles.container}>
            <Text style={styles.hint}>
                How much time can you dedicate to reading daily?
            </Text>

            <View style={styles.optionsContainer}>
                {GOAL_OPTIONS.map((option) => {
                    const isSelected = selectedGoal === option.minutes;

                    return (
                        <TouchableOpacity
                            key={option.minutes}
                            style={[
                                styles.optionCard,
                                isSelected && styles.optionCardSelected,
                            ]}
                            onPress={() => handleSelect(option.minutes)}
                            activeOpacity={0.7}
                        >
                            <View style={[
                                styles.iconContainer,
                                isSelected && styles.iconContainerSelected,
                            ]}>
                                <Ionicons
                                    name={option.icon}
                                    size={28}
                                    color={isSelected ? theme.colors.primary : theme.colors.textMuted}
                                />
                            </View>
                            <Text style={[
                                styles.optionLabel,
                                isSelected && styles.optionLabelSelected,
                            ]}>
                                {option.label}
                            </Text>
                            <Text style={styles.optionDescription}>
                                {option.description}
                            </Text>
                            {option.minutes === 15 && (
                                <View style={styles.recommendedBadge}>
                                    <Text style={styles.recommendedText}>★</Text>
                                </View>
                            )}
                            {isSelected && (
                                <View style={styles.checkmark}>
                                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.motivationContainer}>
                <Ionicons name="bulb" size={20} color={theme.colors.warning} />
                <Text style={styles.motivationText}>
                    Just {selectedGoal} minutes a day builds lasting habits!
                </Text>
            </View>
        </View>
    );
});

OnboardingGoalSetting.displayName = 'OnboardingGoalSetting';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: theme.spacing.lg,
            alignItems: 'center',
        },
        hint: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginBottom: theme.spacing.xl,
        },
        optionsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: theme.spacing.md,
        },
        optionCard: {
            width: 140,
            height: 140,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.xl,
            borderWidth: 2,
            borderColor: theme.colors.borderLight,
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.spacing.md,
            position: 'relative',
        },
        optionCardSelected: {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary + '10',
        },
        iconContainer: {
            width: 56,
            height: 56,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: theme.spacing.sm,
        },
        iconContainerSelected: {
            backgroundColor: theme.colors.primary + '20',
        },
        optionLabel: {
            fontSize: theme.typography.size.lg,
            fontWeight: 'bold',
            color: theme.colors.text,
        },
        optionLabelSelected: {
            color: theme.colors.primary,
        },
        optionDescription: {
            fontSize: theme.typography.size.xs,
            color: theme.colors.textMuted,
            marginTop: theme.spacing.xxs,
        },
        recommendedBadge: {
            position: 'absolute',
            top: theme.spacing.sm,
            right: theme.spacing.sm,
        },
        recommendedText: {
            fontSize: 16,
            color: theme.colors.warning,
        },
        checkmark: {
            position: 'absolute',
            top: theme.spacing.sm,
            left: theme.spacing.sm,
            width: 24,
            height: 24,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
        },
        motivationContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.xl,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            backgroundColor: theme.colors.warning + '15',
            borderRadius: theme.radius.lg,
        },
        motivationText: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.text,
            flex: 1,
        },
    });
}
