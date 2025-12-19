import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { type FilterType } from '../molecules/moleculeTypes';

interface LibraryHeaderProps {
    filter: FilterType;
    onSearchPress: () => void;
    onFilterPress: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
    filter,
    onSearchPress,
    onFilterPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.header}>
            <Text style={styles.title}>My Library</Text>
            <View style={styles.headerActions}>
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
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    headerButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterActive: {
        backgroundColor: `${theme.colors.primary}15`,
    },
}));
