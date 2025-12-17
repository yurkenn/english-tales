import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, FlatList, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    SearchBar,
    GenreChip,
    SectionHeader,
    BookCard,
    ContinueReadingCard,
    FeaturedCard,
    NetworkError,
    HomeScreenSkeleton,
} from '@/components';
import { HomeHeader, TrendingStoryCard } from '@/components/home';
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries';
import { Story } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useToastStore } from '@/store/toastStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { haptics } from '@/utils/haptics';

const GENRES = ['For You', 'Easy', 'Medium', 'Hard', 'Authors'];
const DIFFICULTY_MAP: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
};

export default function HomeScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured, error: errorFeatured } = useFeaturedStories();
    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories();
    const { data: categoriesData, isLoading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useCategories();

    const { items: libraryItems } = useLibraryStore();
    const { progressMap } = useProgressStore();
    const libraryActions = useLibraryStore((s) => s.actions);

    const featuredStory = useMemo(() => {
        if (!featuredData?.[0]) return null;
        return mapSanityStory(featuredData[0]);
    }, [featuredData]);

    const allStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData]);

    const filteredStories = useMemo(() => {
        if (selectedGenre === 0) return allStories;
        const difficulty = DIFFICULTY_MAP[selectedGenre];
        return difficulty ? allStories.filter((s: Story) => s.difficulty === difficulty) : allStories;
    }, [allStories, selectedGenre]);

    const recommendedStories = filteredStories.slice(0, 5);
    const trendingList = filteredStories.slice(2, 6);

    const continueReading = useMemo(() => {
        const inProgress = libraryItems.find((item) => {
            const progress = progressMap[item.storyId];
            return progress && progress.percentage > 0 && !progress.isCompleted;
        });
        if (!inProgress) return null;
        const progress = progressMap[inProgress.storyId];
        return {
            ...inProgress,
            progress: progress ? { percentage: progress.percentage, isCompleted: progress.isCompleted } : undefined,
        };
    }, [libraryItems, progressMap]);

    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router]);
    const handleReadPress = useCallback((storyId: string) => router.push(`/reading/${storyId}`), [router]);

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection();
        if (index === 4) {
            router.push('/authors');
        } else {
            setSelectedGenre(index);
        }
    }, [router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchCategories(), refetchFeatured(), refetchStories()]);
        setRefreshing(false);
    }, [refetchCategories, refetchFeatured, refetchStories]);

    const isLoading = loadingCategories || loadingFeatured || loadingStories;

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <HomeScreenSkeleton />
            </View>
        );
    }

    if (errorCategories || errorFeatured || errorStories) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <NetworkError message="Failed to load stories. Please check your connection." onRetry={onRefresh} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <HomeHeader
                userName={user?.displayName || 'Reader'}
                userPhotoUrl={user?.photoURL || undefined}
                isAnonymous={user?.isAnonymous}
            />

            <View style={styles.searchContainer}>
                <SearchBar placeholder="Search English stories..." onPress={() => router.push('/search')} />
            </View>

            <View style={styles.chipsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                    {GENRES.map((genre, index) => (
                        <GenreChip
                            key={genre}
                            label={genre}
                            isSelected={selectedGenre === index}
                            onPress={() => handleGenrePress(index)}
                        />
                    ))}
                </ScrollView>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {continueReading && continueReading.progress && (
                    <View style={styles.section}>
                        <SectionHeader title="Continue Reading" onActionPress={() => router.push('/library')} />
                        <View style={styles.sectionContent}>
                            <ContinueReadingCard
                                story={continueReading.story}
                                progress={continueReading.progress}
                                onPress={() => handleStoryPress(continueReading.storyId)}
                                onPlayPress={() => handleReadPress(continueReading.storyId)}
                            />
                        </View>
                    </View>
                )}

                {featuredStory && (
                    <View style={styles.section}>
                        <SectionHeader title="Daily Pick" />
                        <View style={styles.sectionContent}>
                            <FeaturedCard story={featuredStory} onPress={() => handleStoryPress(featuredStory.id)} />
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <SectionHeader title="Recommended for You" onActionPress={() => router.push('/stories')} />
                    <FlatList
                        data={recommendedStories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <BookCard story={item} showRank={index + 1} onPress={() => handleStoryPress(item.id)} />
                        )}
                        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    />
                </View>

                <View style={styles.section}>
                    <SectionHeader title="Trending Now" onActionPress={() => router.push('/stories?sort=trending')} />
                    <View style={styles.trendingContainer}>
                        {trendingList.map((story: Story, index: number) => (
                            <TrendingStoryCard
                                key={story.id}
                                story={story}
                                rank={index + 1}
                                onPress={() => handleStoryPress(story.id)}
                            />
                        ))}
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    searchContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    chipsWrapper: {
        flexShrink: 0,
    },
    chipsContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 0,
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xxxl,
        gap: theme.spacing.xl,
    },
    section: {
        gap: theme.spacing.md,
    },
    sectionContent: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    carouselContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    trendingContainer: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
