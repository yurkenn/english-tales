import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { View, ScrollView, FlatList, RefreshControl, LayoutAnimation, UIManager, Platform } from 'react-native';
import Animated, { FadeInDown, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
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
    ActiveFilterBadge,
    FilteredEmptyState,
} from '@/components';
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries';
import { Story, CommunityPost } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useToastStore } from '@/store/toastStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { haptics } from '@/utils/haptics';
import { communityService } from '@/services/communityService';
import { socialService } from '@/services/socialService';
import { useTranslation } from 'react-i18next';
import { useRecommendations } from '@/hooks/useRecommendations';

// Enable LayoutAnimation on Android (Only for Old Architecture)
const isFabricEnabled = !!(global as any).nativeFabricUIManager;
if (Platform.OS === 'android' && !isFabricEnabled && UIManager.setLayoutAnimationEnabledExperimental) {
    try {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    } catch (e) {
        // Suppress runtime errors
    }
}

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
    const scrollViewRef = useRef<ScrollView>(null);

    const GENRES = [
        t('home.categories.forYou'),
        t('home.categories.following'),
        t('home.categories.easy'),
        t('home.categories.medium'),
        t('home.categories.hard'),
        t('home.categories.authors')
    ];

    const [followingIds, setFollowingIds] = useState<string[]>([]);
    const [buzz, setBuzz] = useState<any[]>([]);
    const [loadingBuzz, setLoadingBuzz] = useState(true);

    const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured, error: errorFeatured } = useFeaturedStories();
    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories();
    const { data: categoriesData, isLoading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useCategories();

    useEffect(() => {
        const fetchFollowing = async () => {
            if (user) {
                const res = await socialService.getFollowingIds(user.id);
                if (res.success) setFollowingIds(res.data);
            }
        };
        fetchFollowing();
    }, [user]);

    const { items: libraryItems } = useLibraryStore();
    const { progressMap } = useProgressStore();
    const libraryActions = useLibraryStore((s: any) => s.actions);

    const featuredStory = useMemo(() => {
        if (!featuredData?.[0]) return null;
        return mapSanityStory(featuredData[0]);
    }, [featuredData]);

    const allStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData]);

    const recommendedStoriesList = useRecommendations(allStories, libraryItems, progressMap);

    // Calculate counts for each filter
    const filterCounts = useMemo((): Record<number, number> => {
        const beginnerCount = allStories.filter((s: Story) => s.difficulty === 'beginner').length;
        const intermediateCount = allStories.filter((s: Story) => s.difficulty === 'intermediate').length;
        const advancedCount = allStories.filter((s: Story) => s.difficulty === 'advanced').length;
        const followingCount = allStories.filter((s: Story) => followingIds.includes(s.authorId || '')).length;

        return {
            0: recommendedStoriesList.length, // For You
            1: followingCount, // Following
            2: beginnerCount, // Easy
            3: intermediateCount, // Medium
            4: advancedCount, // Hard
            5: 0, // Authors (navigates away)
        };
    }, [allStories, followingIds, recommendedStoriesList]);

    const filteredStories = useMemo(() => {
        if (selectedGenre === 0) return recommendedStoriesList;
        if (selectedGenre === 1) {
            // Following Filter
            return allStories.filter((s: Story) => followingIds.includes(s.authorId || ''));
        }

        // Adjust index for difficulty map because we inserted "Following" at index 1
        const difficulty = DIFFICULTY_MAP[selectedGenre - 1];
        return difficulty ? allStories.filter((s: Story) => s.difficulty === difficulty) : allStories;
    }, [allStories, selectedGenre, followingIds, recommendedStoriesList]);

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
    const fetchFollowing = useCallback(async () => {
        if (user) {
            const res = await socialService.getFollowingIds(user.id);
            if (res.success) setFollowingIds(res.data);
        }
    }, [user]);

    useEffect(() => {
        fetchFollowing();
    }, [fetchFollowing]);

    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router]);
    const handleReadPress = useCallback((storyId: string) => router.push(`/reading/${storyId}`), [router]);

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection();
        if (index === 5) {
            router.push('/authors');
        } else {
            // Animate layout change
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setSelectedGenre(index);

            // Auto-scroll to content area after filter change
            setTimeout(() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
            }, 100);
        }
    }, [router]);

    const handleClearFilter = useCallback(() => {
        haptics.selection();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSelectedGenre(0);
    }, []);

    const fetchBuzz = useCallback(async () => {
        try {
            const result = await communityService.getBuzzActivities(10);
            if (result.success) {
                const mapped = result.data.map((post: CommunityPost) => {
                    const type = post.type as any;
                    let targetName = (post.metadata as any)?.storyTitle ||
                        (post.metadata as any)?.achievementTitle ||
                        (post.metadata as any)?.targetUserName ||
                        'a story';

                    return {
                        id: post.id,
                        userId: post.userId,
                        userName: post.userName,
                        userPhoto: post.userPhoto,
                        type: type,
                        targetName,
                        timestamp: (post.timestamp as any)?.toDate ? (post.timestamp as any).toDate() : new Date(),
                    };
                });
                setBuzz(mapped);
            }
        } catch (e) {
            console.error('Error fetching buzz:', e);
        } finally {
            setLoadingBuzz(false);
        }
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([refetchCategories(), refetchFeatured(), refetchStories(), fetchBuzz()]);
        } finally {
            setRefreshing(false);
        }
    }, [refetchCategories, refetchFeatured, refetchStories, fetchBuzz]);

    useEffect(() => {
        fetchBuzz();
    }, [fetchBuzz]);

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

    const isFilterActive = selectedGenre !== 0;
    const hasNoResults = filteredStories.length === 0;

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
                            count={index !== 5 ? filterCounts[index] : undefined}
                            onPress={() => handleGenrePress(index)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Active Filter Badge */}
            {isFilterActive && (
                <ActiveFilterBadge
                    filterName={GENRES[selectedGenre]}
                    resultCount={filteredStories.length}
                    onClear={handleClearFilter}
                />
            )}

            <ScrollView
                ref={scrollViewRef}
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
                {/* Show empty state when filter has no results */}
                {hasNoResults ? (
                    <FilteredEmptyState
                        filterName={GENRES[selectedGenre]}
                        onClearFilter={handleClearFilter}
                    />
                ) : (
                    <>
                        <CommunityBuzz
                            activities={buzz}
                            onPressActivity={(activity) => router.push(`/user/${activity.userId}`)}
                        />

                        {continueReading && continueReading.progress && (
                            <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                                <SectionHeader title={t('home.continueReading')} onActionPress={() => router.push('/library')} />
                                <View style={styles.sectionContent}>
                                    <ContinueReadingCard
                                        story={continueReading.story}
                                        progress={continueReading.progress}
                                        onPress={() => handleStoryPress(continueReading.storyId)}
                                        onPlayPress={() => handleReadPress(continueReading.storyId)}
                                    />
                                </View>
                            </Animated.View>
                        )}

                        {featuredStory && !isFilterActive && (
                            <Animated.View entering={FadeIn.duration(300)} style={styles.section}>
                                <SectionHeader title={t('home.dailyPick')} />
                                <View style={styles.sectionContent}>
                                    <FeaturedCard story={featuredStory} onPress={() => handleStoryPress(featuredStory.id)} />
                                </View>
                            </Animated.View>
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
                    </>
                )}
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
        flexGrow: 1,
        paddingBottom: 120,
        gap: theme.spacing.lg,
    },
    section: {
        gap: theme.spacing.sm,
    },
    sectionContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    carouselContent: {
        paddingHorizontal: theme.spacing.lg,
    },
    trendingContainer: {
        paddingHorizontal: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
