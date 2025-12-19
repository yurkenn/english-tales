import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, FlatList, RefreshControl, Dimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    NetworkError,
    EmptyState,
    StoryGridCard,
    StoriesStatsRow,
    StoriesHeader,
} from '@/components';
import { type DifficultyFilter } from '@/components/molecules/moleculeTypes';
import { useStories } from '@/hooks/useQueries';
import { mapSanityStory } from '@/utils/storyMapper';
import { useLibraryStore } from '@/store/libraryStore';
import { haptics } from '@/utils/haptics';
import { Story } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;

export default function StoriesScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { difficulty: difficultyParam, sort: sortParam } = useLocalSearchParams<{ difficulty?: string; sort?: string }>();

    const initialFilter = useMemo((): DifficultyFilter => {
        if (difficultyParam === 'beginner' || difficultyParam === 'intermediate' || difficultyParam === 'advanced') {
            return difficultyParam;
        }
        return 'all';
    }, [difficultyParam]);

    const [filter, setFilter] = useState<DifficultyFilter>(initialFilter);
    const [refreshing, setRefreshing] = useState(false);

    const screenTitle = useMemo(() => {
        if (sortParam === 'trending') return 'Trending Stories';
        return 'All Stories';
    }, [sortParam]);

    useEffect(() => {
        if (difficultyParam === 'beginner' || difficultyParam === 'intermediate' || difficultyParam === 'advanced') {
            setFilter(difficultyParam);
        }
    }, [difficultyParam]);

    const { data: storiesData, isLoading, isError, refetch } = useStories();
    const { actions: libraryActions } = useLibraryStore();

    const allStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData]);

    const filteredStories = useMemo(() => {
        if (filter === 'all') return allStories;
        return allStories.filter((s: Story) => s.difficulty === filter);
    }, [allStories, filter]);

    const stats = useMemo(() => ({
        total: allStories.length,
        beginner: allStories.filter((s: Story) => s.difficulty === 'beginner').length,
        intermediate: allStories.filter((s: Story) => s.difficulty === 'intermediate').length,
        advanced: allStories.filter((s: Story) => s.difficulty === 'advanced').length,
    }), [allStories]);

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.light();
        router.push(`/story/${storyId}`);
    }, [router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const cycleFilter = useCallback(() => {
        haptics.selection();
        const filters: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];
        const currentIndex = filters.indexOf(filter);
        setFilter(filters[(currentIndex + 1) % filters.length]);
    }, [filter]);

    const renderItem = useCallback(({ item, index }: { item: Story; index: number }) => (
        <Animated.View
            entering={FadeInDown.delay((index % 6) * 100).duration(500).springify()}
            style={{ flex: 1, maxWidth: '48%' }}
        >
            <StoryGridCard
                story={item}
                isInLibrary={libraryActions.isInLibrary(item.id)}
                onPress={() => handleStoryPress(item.id)}
            />
        </Animated.View>
    ), [libraryActions, handleStoryPress]);

    if (isError) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <NetworkError message="Failed to load stories" onRetry={refetch} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StoriesHeader
                title={screenTitle}
                filter={filter}
                onBackPress={() => router.back()}
                onSearchPress={() => router.push('/search')}
                onFilterPress={cycleFilter}
            />

            <StoriesStatsRow
                stats={stats}
                activeFilter={filter}
                onFilterChange={setFilter}
            />

            <FlatList
                data={filteredStories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={6}
                windowSize={10}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    isLoading ? null : (
                        <EmptyState
                            icon="book-outline"
                            title="No stories found"
                            message="Try changing the filter to find stories."
                        />
                    )
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
    listContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: theme.spacing.xxxl,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 0,
    },
}));
