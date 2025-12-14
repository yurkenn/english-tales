import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BookListItem } from '@/components';
import { mockStories } from '@/data/mock';

export default function SearchScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [query, setQuery] = useState('');

    const filteredStories = query.length > 0
        ? mockStories.filter(
            (s) =>
                s.title.toLowerCase().includes(query.toLowerCase()) ||
                s.author.toLowerCase().includes(query.toLowerCase()) ||
                s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()))
        )
        : [];

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

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
            ) : filteredStories.length === 0 ? (
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
                    data={filteredStories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookListItem
                            story={item}
                            onPress={() => handleStoryPress(item.id)}
                            onBookmarkPress={() => { }}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListHeaderComponent={
                        <Text style={styles.resultsCount}>
                            {filteredStories.length} result{filteredStories.length !== 1 ? 's' : ''}
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
