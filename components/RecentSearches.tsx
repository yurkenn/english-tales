import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface RecentSearchesProps {
    searches: string[];
    onSearchPress: (term: string) => void;
    onClear: () => void;
}

export const RecentSearches: React.FC<RecentSearchesProps> = ({
    searches,
    onSearchPress,
    onClear,
}) => {
    const { theme } = useUnistyles();

    if (searches.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={onClear}>
                    <Text style={styles.clearText}>Clear</Text>
                </Pressable>
            </View>
            {searches.map((term, index) => (
                <Pressable
                    key={term + index}
                    style={styles.suggestionItem}
                    onPress={() => {
                        haptics.selection();
                        onSearchPress(term);
                    }}
                >
                    <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.suggestionText}>{term}</Text>
                </Pressable>
            ))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    clearText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.primary,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    suggestionText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.text,
    },
}));
