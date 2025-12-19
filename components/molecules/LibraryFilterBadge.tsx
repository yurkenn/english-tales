import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { FILTER_LABELS, type FilterType } from './moleculeTypes';

interface LibraryFilterBadgeProps {
    filter: FilterType;
    onPress: () => void;
}

export const LibraryFilterBadge: React.FC<LibraryFilterBadgeProps> = ({
    filter,
    onPress,
}) => {
    const { theme } = useUnistyles();

    if (filter === 'all') return null;

    return (
        <View style={styles.filterBadgeRow}>
            <Pressable style={styles.filterBadge} onPress={onPress}>
                <Text style={styles.filterBadgeText}>{FILTER_LABELS[filter]}</Text>
                <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    filterBadgeRow: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: `${theme.colors.primary}15`,
        borderRadius: theme.radius.full,
    },
    filterBadgeText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.primary,
    },
}));
