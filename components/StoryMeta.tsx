import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';

interface StoryMetaProps {
    readTime: number;
    wordCount: number;
    difficulty: string;
}

export const StoryMeta: React.FC<StoryMetaProps> = ({
    readTime,
    wordCount,
    difficulty,
}) => {
    const { theme } = useUnistyles();

    const formatReadTime = (minutes: number): string => {
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    const formatDifficulty = (diff: string): string => {
        return diff.charAt(0).toUpperCase() + diff.slice(1);
    };

    return (
        <View style={styles.container}>
            <View style={styles.item}>
                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.text}>{formatReadTime(readTime)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.text}>{wordCount.toLocaleString()} words</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.item}>
                <Ionicons name="school-outline" size={18} color={theme.colors.textSecondary} />
                <Text style={styles.text}>{formatDifficulty(difficulty)}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.backgroundSecondary,
        padding: theme.spacing.lg,
        borderRadius: theme.radius.xl,
    },
    item: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: theme.colors.border,
    },
    text: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.typography.weight.medium,
    },
}));
