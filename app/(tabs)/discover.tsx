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
    NetworkError,
    AuthorSpotlight,
    DiscoverScreenSkeleton,
} from '@/components';
import {
    DiscoverHeader,
    SurpriseMeButton,
    PopularStoryCard,
    BrowseAllButton,
} from '@/components/discover';
import { useStories, useFeaturedAuthor } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';
import { haptics } from '@/utils/haptics';

const GENRES = ['All', 'Easy', 'Medium', 'Hard', 'Authors'];
const DIFFICULTY_MAP: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
};

export default function DiscoverScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories();
    const { data: authorData, isLoading: loadingAuthor, refetch: refetchAuthor, error: errorAuthor } = useFeaturedAuthor();

    const allStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData]);

    const filteredStories = useMemo(() => {
        if (selectedGenre === 0) return allStories;
        const difficulty = DIFFICULTY_MAP[selectedGenre];
        return difficulty ? allStories.filter((s: Story) => s.difficulty === difficulty) : allStories;
    }, [allStories, selectedGenre]);

    const recentlyAdded = useMemo(() => {
        return [...filteredStories]
            .sort((a, b) => {
                const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, 5);
    }, [filteredStories]);

    const popularStories = useMemo(() => filteredStories.slice(0, 5), [filteredStories]);

    const featuredAuthor = useMemo(() => {
        if (!authorData) return null;
        return {
            id: authorData._id,
            name: authorData.name,
            bio: authorData.bio || '',
            imageUrl: authorData.image ? urlFor(authorData.image).width(600).url() : '',
            storyCount: authorData.storyCount || 0,
        };
    }, [authorData]);

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection();
        if (index === 4) {
            router.push('/authors');
            return;
        }
        setSelectedGenre(index);
    }, [router]);

    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router]);
    const handleSearch = useCallback(() => router.push('/search'), [router]);

    const handleSurpriseMe = useCallback(() => {
        haptics.medium();
        if (allStories.length > 0) {
            const randomIndex = Math.floor(Math.random() * allStories.length);
            router.push(`/story/${allStories[randomIndex].id}`);
        }
    }, [allStories, router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchStories(), refetchAuthor()]);
        setRefreshing(false);
    }, [refetchStories, refetchAuthor]);

    const isLoading = loadingStories || loadingAuthor;

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <DiscoverScreenSkeleton />
            </View>
        );
    }

    if (errorStories || errorAuthor) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <NetworkError message="Failed to load content. Please try again." onRetry={onRefresh} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <DiscoverHeader />

            <View style={styles.searchContainer}>
                <SearchBar placeholder="Search titles, authors, or genres..." onPress={handleSearch} />
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
                <SurpriseMeButton onPress={handleSurpriseMe} />

                {featuredAuthor && (
                    <View style={styles.section}>
                        <SectionHeader title="Author Spotlight" />
                        <View style={styles.sectionContent}>
                            <AuthorSpotlight
                                id={featuredAuthor.id}
                                name={featuredAuthor.name}
                                bio={featuredAuthor.bio}
                                imageUrl={featuredAuthor.imageUrl}
                                onPress={() => router.push(`/author/${featuredAuthor.id}`)}
                            />
                        </View>
                    </View>
                )}

                {recentlyAdded.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Recently Added" onActionPress={() => router.push('/stories')} />
                        <FlatList
                            data={recentlyAdded}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <BookCard story={item} onPress={() => handleStoryPress(item.id)} />
                            )}
                            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                        />
                    </View>
                )}

                {popularStories.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Popular This Week" onActionPress={() => router.push('/stories')} />
                        <View style={styles.popularContainer}>
                            {popularStories.map((story: Story, index: number) => (
                                <PopularStoryCard
                                    key={story.id}
                                    story={story}
                                    rank={index + 1}
                                    onPress={() => handleStoryPress(story.id)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <BrowseAllButton onPress={() => router.push('/stories')} />
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
        marginBottom: theme.spacing.sm,
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
    popularContainer: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.sm,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
