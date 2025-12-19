import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Ionicons } from '@expo/vector-icons';
import { SavedWord } from '@/store/vocabularyStore';

interface VocabularyItemProps {
    item: SavedWord;
    onRemove: (id: string) => void;
    onPress?: (item: SavedWord) => void;
}

export const VocabularyItem: React.FC<VocabularyItemProps> = ({ item, onRemove, onPress }) => {
    const { theme } = useUnistyles();

    return (
        <Pressable
            style={styles.container}
            onPress={() => onPress?.(item)}
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
            <Pressable
                onPress={() => onRemove(item.id)}
                style={styles.removeButton}
                hitSlop={12}
            >
                <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
            </Pressable>
        </Pressable>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
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
        marginBottom: 4,
    },
    word: {
        fontSize: theme.typography.size.lg,
        fontWeight: 'bold',
        color: theme.colors.text,
        textTransform: 'capitalize',
    },
    partOfSpeech: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.primary,
        backgroundColor: theme.colors.primary + '10',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    definition: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    source: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
        marginTop: 4,
        opacity: 0.8,
    },
    removeButton: {
        padding: theme.spacing.sm,
        marginLeft: theme.spacing.md,
    },
}));
