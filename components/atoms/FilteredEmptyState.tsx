import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { haptics } from '@/utils/haptics';

interface FilteredEmptyStateProps {
    filterName: string;
    onClearFilter: () => void;
}

export const FilteredEmptyState: React.FC<FilteredEmptyStateProps> = ({
    filterName,
    onClearFilter,
}) => {
    const { theme } = useUnistyles();
    const { t } = useTranslation();

    const handleClear = () => {
        haptics.selection();
        onClearFilter();
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            <View style={styles.iconContainer}>
                <Ionicons name="filter-outline" size={48} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.title}>
                {t('home.noResultsTitle', 'No stories found')}
            </Text>
            <Text style={styles.description}>
                {t('home.noResultsDesc', 'No stories match the "{{filter}}" filter. Try a different category.', { filter: filterName })}
            </Text>
            <Pressable style={styles.button} onPress={handleClear}>
                <Ionicons name="refresh" size={18} color={theme.colors.textInverse} />
                <Text style={styles.buttonText}>
                    {t('home.clearFilter', 'Clear Filter')}
                </Text>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xxl,
        paddingVertical: theme.spacing.xxxxl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: theme.spacing.xl,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.full,
    },
    buttonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textInverse,
    },
}));
