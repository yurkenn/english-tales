import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStoriesByCategory } from '@/hooks/useQueries';
import { BookListItem, NetworkError } from '@/components';
import { mapSanityStory } from '@/utils/storyMapper';
import { useLibraryStore } from '@/store/libraryStore';
import { haptics } from '@/utils/haptics';
import { Story } from '@/types';

export default function CategoryScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
    const { actions: libraryActions } = useLibraryStore();
    const [refreshing, setRefreshing] = useState(false);

    const { data: storiesData, isLoading, isError, refetch } = useStoriesByCategory(id || '');

    const stories = useMemo(() => {
        return storiesData?.map(mapSanityStory) || [];
    }, [storiesData]);

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleBookmarkPress = async (story: Story) => {
        haptics.selection();
        if (libraryActions.isInLibrary(story.id)) {
            await libraryActions.removeFromLibrary(story.id);
        } else {
            await libraryActions.addToLibrary(story);
        }
    };

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (isError) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <NetworkError
                    message="Failed to load stories"
                    onRetry={refetch}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.title}>{title || 'Stories'}</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Stories */}
            <FlatList
                data={stories}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <BookListItem
                        story={item}
                        onPress={() => handleStoryPress(item.id)}
                        onBookmarkPress={() => handleBookmarkPress(item)}
                        isBookmarked={libraryActions.isInLibrary(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="book-outline" size={48} color={theme.colors.textMuted} />
                        <Text style={styles.emptyText}>No stories in this category yet</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    placeholder: {
        width: 40,
    },
    listContent: {
        padding: theme.spacing.lg,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxl,
        gap: theme.spacing.md,
    },
    emptyText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textMuted,
    },
}));
