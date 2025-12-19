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
    ContinueReadingCard,
    FeaturedCard,
    NetworkError,
    HomeScreenSkeleton,
    HomeHeader,
    TrendingStoryCard,
    CommunityBuzz,
} from '@/components';
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries';
import { Story } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useToastStore } from '@/store/toastStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { haptics } from '@/utils/haptics';

import { useTranslation } from 'react-i18next';

const DIFFICULTY_MAP: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
};

export default function HomeScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [selectedGenre, setSelectedGenre] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const GENRES = [
        t('home.categories.forYou'),
        t('home.categories.easy'),
        t('home.categories.medium'),
        t('home.categories.hard'),
        t('home.categories.authors')
    ];

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
                <NetworkError message={t('common.error')} onRetry={onRefresh} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <HomeHeader
                userName={user?.displayName || t('home.greetingDefault')}
                userPhotoUrl={user?.photoURL || undefined}
                isAnonymous={user?.isAnonymous}
                onSocialPress={() => { haptics.selection(); router.push('/social' as any); }}
                onNotificationPress={() => { haptics.selection(); router.push('/settings' as any); }}
            />

            <View style={styles.searchContainer}>
                <SearchBar placeholder={t('home.searchPlaceholder')} onPress={() => router.push('/search')} />
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
                <CommunityBuzz
                    activities={[
                        {
                            id: '1',
                            userId: 'u1',
                            userName: 'Sophie',
                            userPhoto: 'https://i.pravatar.cc/150?u=u1',
                            type: 'story_completed',
                            targetName: 'The Ugly Duckling',
                            timestamp: new Date()
                        },
                        {
                            id: '2',
                            userId: 'u2',
                            userName: 'Mert',
                            userPhoto: 'https://i.pravatar.cc/150?u=u2',
                            type: 'achievement',
                            targetName: '7 Day Streak',
                            timestamp: new Date()
                        },
                        {
                            id: '3',
                            userId: 'u3',
                            userName: 'Elena',
                            userPhoto: 'https://i.pravatar.cc/150?u=u3',
                            type: 'started_reading',
                            targetName: 'Sherlock Holmes',
                            timestamp: new Date()
                        }
                    ]}
                />

                {continueReading && continueReading.progress && (
                    <View style={styles.section}>
                        <SectionHeader title={t('home.continueReading')} onActionPress={() => router.push('/library')} />
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
                        <SectionHeader title={t('home.dailyPick')} />
                        <View style={styles.sectionContent}>
                            <FeaturedCard story={featuredStory} onPress={() => handleStoryPress(featuredStory.id)} />
                        </View>
                    </View>
                )}

                <View style={styles.section}>
                    <SectionHeader title={t('home.recommended')} onActionPress={() => router.push('/stories')} />
                    <FlatList
                        data={recommendedStories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
                                <BookCard story={item} showRank={index + 1} onPress={() => handleStoryPress(item.id)} />
                            </Animated.View>
                        )}
                        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    />
                </View>

                <View style={styles.section}>
                    <SectionHeader title={t('home.trending')} onActionPress={() => router.push('/stories?sort=trending')} />
                    <View style={styles.trendingContainer}>
                        {trendingList.map((story: Story, index: number) => (
                            <Animated.View
                                key={story.id}
                                entering={FadeInDown.delay(400 + index * 100).duration(500).springify()}
                            >
                                <TrendingStoryCard
                                    story={story}
                                    rank={index + 1}
                                    onPress={() => handleStoryPress(story.id)}
                                />
                            </Animated.View>
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
