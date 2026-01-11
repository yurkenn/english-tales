import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

interface SearchHeaderProps {
    query: string;
    onQueryChange: (query: string) => void;
    onBack: () => void;
    autoFocus?: boolean;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    query,
    onQueryChange,
    onBack,
    autoFocus = true,
}) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.searchInputContainer}>
                <Ionicons name="search" size={20} color={theme.colors.textMuted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search titles, authors, or genres..."
                    placeholderTextColor={theme.colors.textMuted}
                    value={query}
                    onChangeText={onQueryChange}
                    autoFocus={autoFocus}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => onQueryChange('')} activeOpacity={0.7}>
                        <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        paddingHorizontal: theme.spacing.md,
        height: 48,
        gap: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: theme.typography.size.lg,
        color: theme.colors.text,
        height: '100%',
    },
});
