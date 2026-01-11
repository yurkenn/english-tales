import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
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
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending</Text>
            <View style={styles.tagsContainer}>
                {suggestions.map((term) => (
                    <TouchableOpacity
                        key={term}
                        style={styles.tagChip}
                        onPress={() => {
                            haptics.selection();
                            onSuggestionPress(term);
                        }}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="trending-up" size={14} color={theme.colors.primary} />
                        <Text style={styles.tagText}>{term}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
