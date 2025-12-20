import React, { useState, useMemo, useCallback } from 'react';
import { View, ScrollView, FlatList, RefreshControl } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
    DiscoverHeader,
    SurpriseMeButton,
    PopularStoryCard,
    BrowseAllButton,
} from '@/components';
import { useStories, useFeaturedAuthor } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';
import { haptics } from '@/utils/haptics';

import { useTranslation } from 'react-i18next';

const DIFFICULTY_MAP: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
};

export default function DiscoverScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const GENRES = [
        t('discover.categories.all'),
        t('discover.categories.easy'),
        t('discover.categories.medium'),
        t('discover.categories.hard'),
        t('discover.categories.authors')
    ];

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
                <NetworkError message={t('common.error')} onRetry={onRefresh} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <DiscoverHeader />

            <View style={styles.searchContainer}>
                <SearchBar placeholder={t('discover.searchPlaceholder')} onPress={handleSearch} />
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
                        <SectionHeader title={t('discover.authorSpotlight')} />
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
                        <SectionHeader title={t('discover.recentlyAdded')} onActionPress={() => router.push('/stories')} />
                        <FlatList
                            data={recentlyAdded}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.carouselContent}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => (
                                <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
                                    <BookCard story={item} onPress={() => handleStoryPress(item.id)} />
                                </Animated.View>
                            )}
                            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                        />
                    </View>
                )}

                {popularStories.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title={t('discover.popularThisWeek')} onActionPress={() => router.push('/stories')} />
                        <View style={styles.popularContainer}>
                            {popularStories.map((story: Story, index: number) => (
                                <Animated.View
                                    key={story.id}
                                    entering={FadeInDown.delay(300 + index * 100).duration(500).springify()}
                                >
                                    <PopularStoryCard
                                        story={story}
                                        rank={index + 1}
                                        onPress={() => handleStoryPress(story.id)}
                                    />
                                </Animated.View>
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
        paddingHorizontal: 20,
        paddingTop: 0,
        paddingBottom: 8,
    },
    chipsWrapper: {
        flexShrink: 0,
    },
    chipsContainer: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        gap: 8,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 120,
        gap: theme.spacing.xxxl,
    },
    section: {
        gap: theme.spacing.md,
    },
    sectionContent: {
        paddingHorizontal: 20,
    },
    carouselContent: {
        paddingHorizontal: 20,
    },
    popularContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
