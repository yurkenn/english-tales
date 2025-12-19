import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface TrendingSuggestionsProps {
    suggestions: string[];
    onSuggestionPress: (term: string) => void;
}

export const TrendingSuggestions: React.FC<TrendingSuggestionsProps> = ({
    suggestions,
    onSuggestionPress,
}) => {
    const { theme } = useUnistyles();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.tagsContainer}>
                {suggestions.map((term) => (
                    <Pressable
                        key={term}
                        style={styles.tagChip}
                        onPress={() => {
                            haptics.selection();
                            onSuggestionPress(term);
                        }}
                    >
                        <Ionicons name="trending-up" size={14} color={theme.colors.primary} />
                        <Text style={styles.tagText}>{term}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    section: {
        marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.backgroundSecondary,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.full,
        gap: theme.spacing.xs,
    },
    tagText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.text,
    },
}));
