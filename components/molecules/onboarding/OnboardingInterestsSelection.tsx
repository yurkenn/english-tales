/**
 * OnboardingInterestsSelection - Category/Interest Selection Component
 */
import { FC, memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface Category {
    id: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
}

const CATEGORIES: Category[] = [
    { id: 'adventure', label: 'Adventure', icon: 'compass', color: '#F59E0B' },
    { id: 'fantasy', label: 'Fantasy', icon: 'sparkles', color: '#8B5CF6' },
    { id: 'romance', label: 'Romance', icon: 'heart', color: '#EC4899' },
    { id: 'mystery', label: 'Mystery', icon: 'search', color: '#6366F1' },
    { id: 'scifi', label: 'Sci-Fi', icon: 'planet', color: '#06B6D4' },
    { id: 'horror', label: 'Horror', icon: 'skull', color: '#EF4444' },
    { id: 'comedy', label: 'Comedy', icon: 'happy', color: '#22C55E' },
    { id: 'drama', label: 'Drama', icon: 'sad', color: '#F97316' },
    { id: 'classic', label: 'Classics', icon: 'book', color: '#78716C' },
    { id: 'fairy', label: 'Fairy Tales', icon: 'star', color: '#FBBF24' },
    { id: 'fable', label: 'Fables', icon: 'paw', color: '#84CC16' },
    { id: 'historical', label: 'Historical', icon: 'time', color: '#A1A1AA' },
];

const MIN_SELECTIONS = 2;

interface OnboardingInterestsSelectionProps {
    readonly selectedCategories: string[];
    readonly onSelectCategory: (categories: string[]) => void;
}

export const OnboardingInterestsSelection: FC<OnboardingInterestsSelectionProps> = memo(({
    selectedCategories,
    onSelectCategory,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    const handleToggle = useCallback((categoryId: string) => {
        haptics.selection();

        if (selectedCategories.includes(categoryId)) {
            // Remove
            onSelectCategory(selectedCategories.filter(id => id !== categoryId));
        } else {
            // Add
            onSelectCategory([...selectedCategories, categoryId]);
        }
    }, [selectedCategories, onSelectCategory]);

    const isValid = selectedCategories.length >= MIN_SELECTIONS;

    return (
        <View style={styles.container}>
            <Text style={styles.hint}>
                Select at least {MIN_SELECTIONS} categories you enjoy
            </Text>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.grid}
                showsVerticalScrollIndicator={false}
            >
                {CATEGORIES.map((category) => {
                    const isSelected = selectedCategories.includes(category.id);

                    return (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.chip,
                                isSelected && [styles.chipSelected, { borderColor: category.color }],
                            ]}
                            onPress={() => handleToggle(category.id)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: category.color + '20' }]}>
                                <Ionicons
                                    name={category.icon}
                                    size={20}
                                    color={isSelected ? category.color : theme.colors.textMuted}
                                />
                            </View>
                            <Text style={[
                                styles.chipLabel,
                                isSelected && { color: category.color },
                            ]}>
                                {category.label}
                            </Text>
                            {isSelected && (
                                <View style={[styles.checkmark, { backgroundColor: category.color }]}>
                                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {!isValid && (
                <Text style={styles.validationText}>
                    Select {MIN_SELECTIONS - selectedCategories.length} more to continue
                </Text>
            )}
        </View>
    );
});

OnboardingInterestsSelection.displayName = 'OnboardingInterestsSelection';

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            width: '100%',
            paddingHorizontal: theme.spacing.lg,
            flex: 1,
        },
        hint: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.textMuted,
            textAlign: 'center',
            marginBottom: theme.spacing.lg,
        },
        scrollView: {
            flex: 1,
        },
        grid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: theme.spacing.sm,
            paddingBottom: theme.spacing.xl,
        },
        chip: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.full,
            borderWidth: 2,
            borderColor: theme.colors.borderLight,
            gap: theme.spacing.xs,
        },
        chipSelected: {
            backgroundColor: theme.colors.surface,
        },
        iconContainer: {
            width: 32,
            height: 32,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
        },
        chipLabel: {
            fontSize: theme.typography.size.sm,
            fontWeight: '600',
            color: theme.colors.text,
        },
        checkmark: {
            width: 18,
            height: 18,
            borderRadius: theme.radius.full,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: theme.spacing.xxs,
        },
        validationText: {
            fontSize: theme.typography.size.sm,
            color: theme.colors.warning,
            textAlign: 'center',
            marginTop: theme.spacing.sm,
        },
    });
}
