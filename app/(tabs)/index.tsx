import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    SearchBar,
    GenreChip,
    SectionHeader,
    BookCard,
    ContinueReadingCard,
    FeaturedCard,
    BookListItem,
    NetworkError,
    HomeScreenSkeleton,
} from '@/components';
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries';
import { Story } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useToastStore } from '@/store/toastStore';
import { mapSanityStory } from '@/utils/storyMapper';
import { haptics } from '@/utils/haptics';

// Get time-based greeting
const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
};

export default function HomeScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const [selectedGenre, setSelectedGenre] = useState(0);

    // Fetch data
    const { data: categoriesData, isLoading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useCategories();
    const { data: featuredData, isLoading: loadingFeatured, refetch: refetchFeatured, error: errorFeatured } = useFeaturedStories();
    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories();

    // Transform Categories - deduplicate to avoid key errors
    // Difficulty-based genre filters + Authors
    const genres = ['For You', 'Easy', 'Medium', 'Hard', 'Authors'];

    const featuredStory = useMemo(() => {
        if (!featuredData?.[0]) return null;
        return mapSanityStory(featuredData[0]);
    }, [featuredData]);

    const allStories = useMemo(() => {
        return storiesData?.map(mapSanityStory) || [];
    }, [storiesData]);

    // Derived Lists
    const recommendedStories = allStories.slice(0, 5);
    const trendingList = allStories.slice(2, 6); // Just taking some other slice

    // Get continue reading from real progress data
    const { items: libraryItems, actions: libraryActions } = useLibraryStore();
    const { progressMap } = useProgressStore();

    const continueReading = useMemo(() => {
        // Find item with progress that's not completed
        const inProgress = libraryItems.find((item) => {
            const progress = progressMap[item.storyId];
            return progress && progress.percentage > 0 && !progress.isCompleted;
        });
        if (!inProgress) return null;

        const progress = progressMap[inProgress.storyId];
        return {
            ...inProgress,
            progress: progress ? {
                percentage: progress.percentage,
                isCompleted: progress.isCompleted,
            } : undefined,
        };
    }, [libraryItems, progressMap]);

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleReadPress = (storyId: string) => {
        router.push(`/reading/${storyId}`);
    };

    const handleBookmarkPress = async (story: Story) => {
        haptics.selection();
        const toastActions = useToastStore.getState().actions;
        if (libraryActions.isInLibrary(story.id)) {
            await libraryActions.removeFromLibrary(story.id);
            toastActions.success('Removed from library');
        } else {
            await libraryActions.addToLibrary(story);
            toastActions.success('Added to library');
        }
    };

    const isLoading = loadingCategories || loadingFeatured || loadingStories;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            refetchCategories(),
            refetchFeatured(),
            refetchStories(),
        ]);
        setRefreshing(false);
    }, [refetchCategories, refetchFeatured, refetchStories]);

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <HomeScreenSkeleton />
            </View>
        );
    }

    const hasError = errorCategories || errorFeatured || errorStories;
    if (hasError) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <NetworkError
                    message="Failed to load stories. Please check your connection."
                    onRetry={onRefresh}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.userRow}>
                    <Image
                        source={{ uri: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Reader')}` }}
                        style={styles.avatar}
                    />
                    <View style={styles.greeting}>
                        <Text style={styles.greetingLabel}>{getGreeting()}</Text>
                        <Text style={styles.userName}>{user?.isAnonymous ? 'Guest' : (user?.displayName || 'Reader')}</Text>
                    </View>
                </View>
                <Pressable
                    style={styles.notificationButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name="notifications-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.text}
                    />
                    <View style={styles.notificationBadge} />
                </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchBar
                    placeholder="Search English stories..."
                    onMicPress={() => { }}
                />
            </View>

            {/* Genre Chips - wrapped to prevent flex expansion */}
            <View style={styles.chipsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipsContainer}
                >
                    {genres.map((genre, index) => (
                        <GenreChip
                            key={genre}
                            label={genre}
                            isSelected={selectedGenre === index}
                            onPress={() => {
                                haptics.selection();
                                if (index === 4) {
                                    router.push('/authors');
                                } else {
                                    setSelectedGenre(index);
                                }
                            }}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Main Content */}
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
                {/* Continue Reading */}
                {continueReading && continueReading.progress && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Continue Reading"
                            onActionPress={() => router.push('/library')}
                        />
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

                {/* Daily Pick */}
                {featuredStory && (
                    <View style={styles.section}>
                        <SectionHeader title="Daily Pick" />
                        <View style={styles.sectionContent}>
                            <FeaturedCard
                                story={featuredStory}
                                onPress={() => handleStoryPress(featuredStory.id)}
                            />
                        </View>
                    </View>
                )}

                {/* Recommended */}
                <View style={styles.section}>
                    <SectionHeader
                        title="Recommended for You"
                        onActionPress={() => router.push('/discover')}
                    />
                    <FlatList
                        data={recommendedStories}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.carouselContent}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item, index }) => (
                            <BookCard
                                story={item}
                                showRank={index + 1}
                                onPress={() => handleStoryPress(item.id)}
                            />
                        )}
                        ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                    />
                </View>

                {/* Trending Now */}
                <View style={styles.section}>
                    <SectionHeader title="Trending Now" />
                    <View style={styles.sectionContent}>
                        {trendingList.map((story: Story) => (
                            <BookListItem
                                key={story.id}
                                story={story}
                                onPress={() => handleStoryPress(story.id)}
                                onBookmarkPress={() => handleBookmarkPress(story)}
                                isBookmarked={libraryActions.isInLibrary(story.id)}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
    },
    userRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    avatar: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.borderLight,
    },
    greeting: {
        gap: 2,
    },
    greetingLabel: {
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    notificationButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        borderWidth: 2,
        borderColor: theme.colors.background,
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
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
