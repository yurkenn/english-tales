import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { View, ScrollView, FlatList, RefreshControl } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
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
} from '@/components'
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries'
import { Story, CommunityPost } from '@/types'
import { useAuthStore } from '@/store/authStore'
import { useLibraryStore } from '@/store/libraryStore'
import { useProgressStore } from '@/store/progressStore'
import { mapSanityStory } from '@/utils/storyMapper'
import { haptics } from '@/utils/haptics'
import { communityService } from '@/services/communityService'
import { socialService } from '@/services/socialService'
import { useRecommendations } from '@/hooks/useRecommendations'

// Constants
const DIFFICULTY_MAP: Record<number, string> = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
}
const AUTHORS_INDEX = 5

export default function HomeScreen() {
    const { t } = useTranslation()
    const { theme } = useUnistyles()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { user } = useAuthStore()

    // State
    const [selectedGenre, setSelectedGenre] = useState(0)
    const [refreshing, setRefreshing] = useState(false)
    const [followingIds, setFollowingIds] = useState<string[]>([])
    const [buzz, setBuzz] = useState<any[]>([])

    // Refs
    const scrollViewRef = useRef<ScrollView>(null)

    // Genre labels
    const genres = useMemo(() => [
        t('home.categories.forYou'),
        t('home.categories.following'),
        t('home.categories.easy'),
        t('home.categories.medium'),
        t('home.categories.hard'),
        t('home.categories.authors'),
    ], [t])

    // Data fetching
    const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured, error: errorFeatured } = useFeaturedStories()
    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories()
    const { isLoading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useCategories()

    // Library & Progress
    const { items: libraryItems } = useLibraryStore()
    const { progressMap } = useProgressStore()

    // Fetch following IDs
    const fetchFollowing = useCallback(async () => {
        if (!user) return
        const res = await socialService.getFollowingIds(user.id)
        if (res.success) setFollowingIds(res.data)
    }, [user])

    useEffect(() => {
        fetchFollowing()
    }, [fetchFollowing])

    // Fetch buzz activities
    const fetchBuzz = useCallback(async () => {
        try {
            const result = await communityService.getBuzzActivities(10)
            if (result.success) {
                const mapped = result.data.map((post: CommunityPost) => ({
                    id: post.id,
                    userId: post.userId,
                    userName: post.userName,
                    userPhoto: post.userPhoto,
                    type: post.type,
                    targetName: (post.metadata as any)?.storyTitle ||
                        (post.metadata as any)?.achievementTitle ||
                        (post.metadata as any)?.targetUserName ||
                        'a story',
                    timestamp: (post.timestamp as any)?.toDate?.() || new Date(),
                }))
                setBuzz(mapped)
            }
        } catch (e) {
            console.error('Error fetching buzz:', e)
        }
    }, [])

    useEffect(() => {
        fetchBuzz()
    }, [fetchBuzz])

    // Derived data
    const featuredStory = useMemo(() => {
        if (!featuredData?.[0]) return null
        return mapSanityStory(featuredData[0])
    }, [featuredData])

    const allStories = useMemo(() => storiesData?.map(mapSanityStory) || [], [storiesData])
    const recommendedStoriesList = useRecommendations(allStories, libraryItems, progressMap)

    const filterCounts = useMemo<Record<number, number>>(() => ({
        0: recommendedStoriesList.length,
        1: allStories.filter((s: Story) => followingIds.includes(s.authorId || '')).length,
        2: allStories.filter((s: Story) => s.difficulty === 'beginner').length,
        3: allStories.filter((s: Story) => s.difficulty === 'intermediate').length,
        4: allStories.filter((s: Story) => s.difficulty === 'advanced').length,
        5: 0,
    }), [allStories, followingIds, recommendedStoriesList])

    const filteredStories = useMemo(() => {
        if (selectedGenre === 0) return recommendedStoriesList
        if (selectedGenre === 1) return allStories.filter((s: Story) => followingIds.includes(s.authorId || ''))
        const difficulty = DIFFICULTY_MAP[selectedGenre - 1]
        return difficulty ? allStories.filter((s: Story) => s.difficulty === difficulty) : allStories
    }, [allStories, selectedGenre, followingIds, recommendedStoriesList])

    const recommendedStories = useMemo(() => filteredStories.slice(0, 5), [filteredStories])
    const trendingList = useMemo(() => filteredStories.slice(2, 6), [filteredStories])

    const continueReading = useMemo(() => {
        const inProgress = libraryItems.find((item) => {
            const progress = progressMap[item.storyId]
            return progress && progress.percentage > 0 && !progress.isCompleted
        })
        if (!inProgress) return null
        const progress = progressMap[inProgress.storyId]
        return {
            ...inProgress,
            progress: progress ? { percentage: progress.percentage, isCompleted: progress.isCompleted } : undefined,
        }
    }, [libraryItems, progressMap])

    // Handlers
    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router])
    const handleReadPress = useCallback((storyId: string) => router.push(`/reading/${storyId}`), [router])
    const handleSearch = useCallback(() => router.push('/search'), [router])
    const handleBrowseStories = useCallback(() => router.push('/stories'), [router])

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection()
        if (index === AUTHORS_INDEX) {
            router.push('/authors')
        } else {
            setSelectedGenre(index)
            setTimeout(() => scrollViewRef.current?.scrollTo({ y: 0, animated: true }), 100)
        }
    }, [router])

    const handleClearFilter = useCallback(() => {
        haptics.selection()
        setSelectedGenre(0)
    }, [])

    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        try {
            await Promise.all([refetchCategories(), refetchFeatured(), refetchStories(), fetchBuzz()])
        } finally {
            setRefreshing(false)
        }
    }, [refetchCategories, refetchFeatured, refetchStories, fetchBuzz])

    // Render functions
    const renderBookCard = useCallback(
        ({ item, index }: { item: Story; index: number }) => (
            <BookCard story={item} showRank={index + 1} onPress={() => handleStoryPress(item.id)} />
        ),
        [handleStoryPress]
    )

    // Computed values
    const isLoading = loadingCategories || loadingFeatured || loadingStories
    const hasError = errorCategories || errorFeatured || errorStories
    const isFilterActive = selectedGenre !== 0
    const hasNoResults = filteredStories.length === 0

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <HomeScreenSkeleton />
            </View>
        )
    }

    // Error state
    if (hasError) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <NetworkError message={t('common.error')} onRetry={onRefresh} />
            </View>
        )
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <HomeHeader
                userName={user?.displayName || t('home.greetingDefault')}
                userPhotoUrl={user?.photoURL || undefined}
                isAnonymous={user?.isAnonymous}
                onProfilePress={() => { haptics.selection(); router.push('/(tabs)/profile') }}
                onSocialPress={() => { haptics.selection(); router.push('/social' as any) }}
                onNotificationPress={() => { haptics.selection(); router.push('/settings' as any) }}
            />

            <View style={styles.searchContainer}>
                <SearchBar placeholder={t('home.searchPlaceholder')} onPress={handleSearch} />
            </View>

            {/* Genre Chips */}
            <View style={styles.chipsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsContainer}>
                    {genres.map((genre, index) => (
                        <GenreChip
                            key={genre}
                            label={genre}
                            isSelected={selectedGenre === index}
                            count={index !== AUTHORS_INDEX ? filterCounts[index] : undefined}
                            onPress={() => handleGenrePress(index)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Active Filter Badge */}
            {isFilterActive && (
                <ActiveFilterBadge
                    filterName={genres[selectedGenre]}
                    resultCount={filteredStories.length}
                    onClear={handleClearFilter}
                />
            )}

            {/* Main Content */}
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
                {hasNoResults ? (
                    <FilteredEmptyState filterName={genres[selectedGenre]} onClearFilter={handleClearFilter} />
                ) : (
                    <>
                        <CommunityBuzz activities={buzz} onPressActivity={(activity) => router.push(`/user/${activity.userId}`)} />

                        {continueReading?.progress && (
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

                        {featuredStory && !isFilterActive && (
                            <View style={styles.section}>
                                <SectionHeader title={t('home.dailyPick')} />
                                <View style={styles.sectionContent}>
                                    <FeaturedCard story={featuredStory} onPress={() => handleStoryPress(featuredStory.id)} />
                                </View>
                            </View>
                        )}

                        <View style={styles.section}>
                            <SectionHeader title={t('home.recommended')} onActionPress={handleBrowseStories} />
                            <FlatList
                                data={recommendedStories}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.carouselContent}
                                keyExtractor={(item) => item.id}
                                renderItem={renderBookCard}
                                ItemSeparatorComponent={() => <View style={styles.horizontalSeparator} />}
                            />
                        </View>

                        <View style={styles.section}>
                            <SectionHeader title={t('home.trending')} onActionPress={() => router.push('/stories?sort=trending')} />
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
                    </>
                )}
            </ScrollView>
        </View>
    )
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
        flexGrow: 1,
        paddingBottom: 120,
        gap: theme.spacing.lg,
    },
    section: {
        gap: theme.spacing.sm,
    },
    sectionContent: {
        paddingHorizontal: 20,
    },
    carouselContent: {
        paddingHorizontal: 20,
    },
    trendingContainer: {
        paddingHorizontal: 20,
        gap: 12,
    },
    horizontalSeparator: {
        width: 16,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}))
