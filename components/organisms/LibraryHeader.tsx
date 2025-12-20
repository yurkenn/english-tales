import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { type FilterType } from '../molecules/moleculeTypes';

interface LibraryHeaderProps {
    filter: FilterType;
    onSearchPress: () => void;
    onFilterPress: () => void;
    onRankingsPress: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
    filter,
    onSearchPress,
    onFilterPress,
    onRankingsPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.header}>
            <Text style={styles.title}>My Library</Text>
            <View style={styles.headerActions}>
                <Pressable
                    style={styles.headerButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onRankingsPress}
                >
                    <Ionicons
                        name="trophy-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.primary}
                    />
                </Pressable>
                <Pressable
                    style={styles.headerButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onSearchPress}
                >
                    <Ionicons
                        name="search-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.text}
                    />
                </Pressable>
                <Pressable
                    style={[styles.headerButton, filter !== 'all' && styles.filterActive]}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={onFilterPress}
                >
                    <Ionicons
                        name="filter-outline"
                        size={theme.iconSize.md}
                        color={filter !== 'all' ? theme.colors.primary : theme.colors.text}
                    />
                </Pressable>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        letterSpacing: -0.8,
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.sm,
    },
    filterActive: {
        backgroundColor: theme.colors.primary + '10', // Consistent with other active states
        borderColor: theme.colors.primary + '40',
    },
}));
