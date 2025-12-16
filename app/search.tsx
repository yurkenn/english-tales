import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    BookListItem,
    SearchHeader,
    SearchEmptyState,
    RecentSearches,
    TrendingSuggestions,
} from '@/components';
import { useSearchStories } from '@/hooks/useQueries';
import { useLibraryStore } from '@/store/libraryStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';
import { haptics } from '@/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@english_tales_recent_searches';
const MAX_RECENT = 5;

const TRENDING_SUGGESTIONS = [
    'fairy tales',
    'adventure',
    'mystery',
    'classic',
    'short stories',
];

export default function SearchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    const { data: searchResults, isLoading, isFetching } = useSearchStories(debouncedQuery);
    const { actions: libraryActions } = useLibraryStore();

    // Load recent searches on mount
    useEffect(() => {
        AsyncStorage.getItem(RECENT_SEARCHES_KEY).then(data => {
            if (data) setRecentSearches(JSON.parse(data));
        });
    }, []);

    // Save search to recent history
    const saveRecentSearch = useCallback(async (term: string) => {
        if (term.length < 2) return;
        const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT);
        setRecentSearches(updated);
        await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    }, [recentSearches]);

    const clearRecentSearches = async () => {
        haptics.light();
        setRecentSearches([]);
        await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            if (query.length >= 2) {
                saveRecentSearch(query);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [query, saveRecentSearch]);

    // Map results to Story type
    const stories: Story[] = searchResults?.map(mapSanityStory) || [];

    const handleStoryPress = useCallback((storyId: string) => {
        router.push(`/story/${storyId}`);
    }, [router]);

    const handleBookmarkPress = useCallback(async (story: Story) => {
        const isInLibrary = libraryActions.isInLibrary(story.id);
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    }, [libraryActions]);

    const renderItem = useCallback(({ item }: { item: Story }) => (
        <BookListItem
            story={item}
            onPress={() => handleStoryPress(item.id)}
            onBookmarkPress={() => handleBookmarkPress(item)}
        />
    ), [handleStoryPress, handleBookmarkPress]);

    const showLoading = isLoading || isFetching;

    const renderContent = () => {
        // Show suggestions when no query
        if (query.length === 0) {
            return (
                <View style={styles.suggestionsContainer}>
                    <RecentSearches
                        searches={recentSearches}
                        onSearchPress={setQuery}
                        onClear={clearRecentSearches}
                    />
                    <TrendingSuggestions
                        suggestions={TRENDING_SUGGESTIONS}
                        onSuggestionPress={setQuery}
                    />
                </View>
            );
        }

        // Minimum characters message
        if (query.length < 2) {
            return <SearchEmptyState type="min-chars" />;
        }

        // Loading state
        if (showLoading) {
            return <SearchEmptyState type="loading" />;
        }

        // No results
        if (stories.length === 0) {
            return <SearchEmptyState type="no-results" />;
        }

        // Results list
        return (
            <FlatList
                data={stories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                updateCellsBatchingPeriod={50}
                ListHeaderComponent={
                    <Text style={styles.resultsCount}>
                        {stories.length} result{stories.length !== 1 ? 's' : ''}
                    </Text>
                }
            />
        );
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <SearchHeader
                query={query}
                onQueryChange={setQuery}
                onBack={() => router.back()}
            />
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    suggestionsContainer: {
        flex: 1,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xxxl,
    },
    resultsCount: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
    },
}));
