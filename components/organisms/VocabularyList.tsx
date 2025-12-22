import React, { useMemo } from 'react';
import { View, FlatList, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { VocabularyItem } from '../molecules/VocabularyItem';
import { SavedWord, useVocabularyStore } from '@/store/vocabularyStore';
import { useAuthStore } from '@/store/authStore';
import { EmptyState } from '../molecules/EmptyState';
import { haptics } from '@/utils/haptics';

import { useTranslation } from 'react-i18next';

interface VocabularyListProps {
    searchQuery?: string;
    onWordPress?: (word: SavedWord) => void;
}

export const VocabularyList: React.FC<VocabularyListProps> = ({ searchQuery = '', onWordPress }) => {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const { user } = useAuthStore();
    const { savedWords, actions } = useVocabularyStore();

    const filteredWords = useMemo(() => {
        const userWords = user?.id ? (savedWords[user.id] || {}) : {};
        const words = Object.values(userWords).sort((a, b) => b.addedAt - a.addedAt);
        if (!searchQuery) return words;

        const query = searchQuery.toLowerCase();
        return words.filter(item =>
            item.word.toLowerCase().includes(query) ||
            item.definition.toLowerCase().includes(query)
        );
    }, [savedWords, searchQuery, user?.id]);

    const handleRemove = (id: string) => {
        if (!user?.id) return;
        haptics.light();
        actions.removeWord(user.id, id);
    };

    if (filteredWords.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <EmptyState
                    icon="bookmark-outline"
                    title={searchQuery ? t('vocabulary.noMatches') : t('vocabulary.empty')}
                    message={searchQuery ? t('vocabulary.noMatchesMessage') : t('vocabulary.emptyMessage')}
                />
            </View>
        );
    }

    return (
        <FlatList
            data={filteredWords}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
                <VocabularyItem
                    item={item}
                    onRemove={handleRemove}
                    onPress={onWordPress}
                />
            )}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            showsVerticalScrollIndicator={false}
        />
    );
};

const styles = StyleSheet.create((theme) => ({
    listContent: {
        paddingVertical: theme.spacing.md,
    },
    separator: {
        height: theme.spacing.md,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingTop: 100,
    },
}));
