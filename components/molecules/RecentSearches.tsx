import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { haptics } from '@/utils/haptics';

interface RecentSearchesProps {
    searches: string[];
    onSearchPress: (term: string) => void;
    onClear: () => void;
}

export const RecentSearches: FC<RecentSearchesProps> = ({
    searches,
    onSearchPress,
    onClear,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    if (searches.length === 0) return null;

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <TouchableOpacity onPress={onClear} activeOpacity={0.6}>
                    <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
            </View>
            {searches.map((term, index) => (
                <TouchableOpacity
                    key={term + index}
                    style={styles.suggestionItem}
                    activeOpacity={0.7}
                    onPress={() => {
                        haptics.selection();
                        onSearchPress(term);
                    }}
                >
                    <Ionicons name="time-outline" size={18} color={theme.colors.textMuted} />
                    <Text style={styles.suggestionText}>{term}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
