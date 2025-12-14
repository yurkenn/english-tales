import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookListItem } from '@/components';
import { useSearchStories } from '@/hooks/useQueries';
import { useLibraryStore } from '@/store/libraryStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';

export default function SearchScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');

    const { data: searchResults, isLoading, isFetching } = useSearchStories(debouncedQuery);
    const { actions: libraryActions } = useLibraryStore();

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Map results to Story type
    const stories: Story[] = searchResults?.map(mapSanityStory) || [];

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleBookmarkPress = async (story: Story) => {
        const isInLibrary = libraryActions.isInLibrary(story.id);
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    };

    const showLoading = isLoading || isFetching;

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Search Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="arrow-back"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
                <View style={styles.searchInputContainer}>
                    <Ionicons
                        name="search"
                        size={20}
                        color={theme.colors.textMuted}
                    />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search titles, authors, or genres..."
                        placeholderTextColor={theme.colors.textMuted}
                        value={query}
                        onChangeText={setQuery}
                        autoFocus
                        returnKeyType="search"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <Pressable onPress={() => setQuery('')}>
                            <Ionicons
                                name="close-circle"
                                size={20}
                                color={theme.colors.textMuted}
                            />
                        </Pressable>
                    )}
                </View>
            </View>

            {/* Results */}
            {query.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons
                        name="search"
                        size={64}
                        color={theme.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>Search for stories</Text>
                    <Text style={styles.emptySubtitle}>
                        Find your next favorite read by title, author, or genre
                    </Text>
                </View>
            ) : query.length < 2 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptySubtitle}>
                        Type at least 2 characters to search
                    </Text>
                </View>
            ) : showLoading ? (
                <View style={styles.loadingState}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>Searching...</Text>
                </View>
            ) : stories.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons
                        name="document-text-outline"
                        size={64}
                        color={theme.colors.textMuted}
                    />
                    <Text style={styles.emptyTitle}>No results found</Text>
                    <Text style={styles.emptySubtitle}>
                        Try a different search term
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={stories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookListItem
                            story={item}
                            onPress={() => handleStoryPress(item.id)}
                            onBookmarkPress={() => handleBookmarkPress(item)}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListHeaderComponent={
                        <Text style={styles.resultsCount}>
                            {stories.length} result{stories.length !== 1 ? 's' : ''}
                        </Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
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
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xxxl,
        gap: theme.spacing.md,
    },
    emptyTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    loadingState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.md,
    },
    loadingText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
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

