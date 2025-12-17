import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import type { DifficultyFilter } from './types';
import { FILTER_LABELS } from './types';

interface StoriesHeaderProps {
    title: string;
    filter: DifficultyFilter;
    onBackPress: () => void;
    onSearchPress: () => void;
    onFilterPress: () => void;
}

export const StoriesHeader: React.FC<StoriesHeaderProps> = ({
    title,
    filter,
    onBackPress,
    onSearchPress,
    onFilterPress,
}) => {
    const { theme } = useUnistyles();
    const isFilterActive = filter !== 'all';

    return (
        <>
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={onBackPress}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.actions}>
                    <Pressable
                        style={styles.button}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={onSearchPress}
                    >
                        <Ionicons name="search-outline" size={theme.iconSize.md} color={theme.colors.text} />
                    </Pressable>
                    <Pressable
                        style={[styles.button, isFilterActive && styles.filterActive]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={onFilterPress}
                    >
                        <Ionicons
                            name="filter-outline"
                            size={theme.iconSize.md}
                            color={isFilterActive ? theme.colors.primary : theme.colors.text}
                        />
                    </Pressable>
                </View>
            </View>

            {isFilterActive && (
                <View style={styles.badgeRow}>
                    <Pressable style={styles.badge} onPress={onFilterPress}>
                        <Text style={styles.badgeText}>{FILTER_LABELS[filter]}</Text>
                        <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                    </Pressable>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    button: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterActive: {
        backgroundColor: `${theme.colors.primary}15`,
    },
    badgeRow: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: `${theme.colors.primary}15`,
        borderRadius: theme.radius.full,
    },
    badgeText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.primary,
    },
}));
