import { FC } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { SavedWord } from '@/store/vocabularyStore';

interface VocabularyItemProps {
    item: SavedWord;
    onRemove: (id: string) => void;
    onPress?: (item: SavedWord) => void;
}

export const VocabularyItem: FC<VocabularyItemProps> = ({ item, onRemove, onPress }) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={() => onPress?.(item)}
            activeOpacity={0.7}
        >
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.word}>{item.word}</Text>
                    {item.partOfSpeech && (
                        <Text style={styles.partOfSpeech}>{item.partOfSpeech}</Text>
                    )}
                </View>
                <Text style={styles.definition} numberOfLines={2}>
                    {item.definition}
                </Text>
                {item.storyTitle && (
                    <Text style={styles.source}>
                        From: {item.storyTitle}
                    </Text>
                )}
            </View>
            <TouchableOpacity
                onPress={() => onRemove(item.id)}
                style={styles.removeButton}
                hitSlop={12}
                activeOpacity={0.6}
            >
                <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: theme.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
        marginBottom: 6,
    },
    word: {
        fontSize: theme.typography.size.xl,
        fontWeight: 'bold',
        color: theme.colors.text,
        textTransform: 'capitalize',
        letterSpacing: -0.4,
    },
    partOfSpeech: {
        fontSize: theme.typography.size.xs,
        fontWeight: 'bold',
        color: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        textTransform: 'uppercase',
        overflow: 'hidden',
    },
    definition: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 22,
    },
    source: {
        fontSize: theme.typography.size.sm,
        fontWeight: '500',
        color: theme.colors.textMuted,
        marginTop: 6,
    },
    removeButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: theme.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
    },
});
