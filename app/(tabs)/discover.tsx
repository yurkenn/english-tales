import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
    SearchBar,
    GenreChip,
    SectionHeader,
    BookCard,
    BookListItem,
    NetworkError,
    AuthorSpotlight,
    DiscoverScreenSkeleton,
    TrendingCard,
} from '@/components';
import { useStories, useFeaturedAuthor, useCategories } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';
import { useLibraryStore } from '@/store/libraryStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

export default function DiscoverScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedGenre, setSelectedGenre] = useState(0);
    const { actions: libraryActions } = useLibraryStore();

    // Fetch real data from Sanity
    const { data: storiesData, isLoading: loadingStories, refetch: refetchStories, error: errorStories } = useStories();
    const { data: authorData, isLoading: loadingAuthor, refetch: refetchAuthor, error: errorAuthor } = useFeaturedAuthor();
    const { data: categoriesData, isLoading: loadingCategories, refetch: refetchCategories, error: errorCategories } = useCategories();

    // Transform data
    const allStories = useMemo(() => {
        return storiesData?.map(mapSanityStory) || [];
    }, [storiesData]);

    const trendingStories = allStories.slice(0, 5);
    const recommendedStories = allStories.slice(5, 10);

    const genres = useMemo(() => {
        const list: { id: string | null; title: string }[] = [{ id: null, title: 'All' }];
        if (categoriesData) {
            list.push(...categoriesData.map((c: { _id: string; title: string }) => ({ id: c._id, title: c.title })));
        }
        return list;
    }, [categoriesData]);

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection();
        const genre = genres[index];
        if (genre.id) {
            router.push(`/category/${genre.id}?title=${encodeURIComponent(genre.title)}`);
        } else {
            setSelectedGenre(index);
        }
    }, [genres, router]);

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

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.selection();
        router.push(`/story/${storyId}`);
    }, [router]);

    const handleSearch = useCallback(() => {
        haptics.selection();
        router.push('/search');
    }, [router]);

    const handleBookmarkPress = useCallback(async (story: Story) => {
        haptics.selection();
        const toastActions = useToastStore.getState().actions;
        if (libraryActions.isInLibrary(story.id)) {
            await libraryActions.removeFromLibrary(story.id);
            toastActions.success('Removed from library');
        } else {
            await libraryActions.addToLibrary(story);
            toastActions.success('Added to library');
        }
    }, [libraryActions]);

    const handleNotificationPress = useCallback(() => {
        haptics.selection();
        const toastActions = useToastStore.getState().actions;
        toastActions.info('Notifications coming soon!');
    }, []);

    const handleTrendingActionPress = useCallback(() => {
        haptics.selection();
        // Could navigate to a trending page or show more trending stories
        const toastActions = useToastStore.getState().actions;
        toastActions.info('View all trending stories');
    }, []);

    const isLoading = loadingStories || loadingAuthor || loadingCategories;
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([refetchStories(), refetchAuthor(), refetchCategories()]);
        setRefreshing(false);
    }, [refetchStories, refetchAuthor, refetchCategories]);

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <DiscoverScreenSkeleton />
            </View>
        );
    }

    const hasError = errorStories || errorAuthor || errorCategories;
    if (hasError) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <NetworkError
                    message="Failed to load content. Please try again."
                    onRetry={onRefresh}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Discover</Text>
                <Pressable
                    style={styles.notificationButton}
                    onPress={handleNotificationPress}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Notifications"
                    accessibilityHint="Double tap to view notifications"
                >
                    <Ionicons
                        name="notifications-outline"
                        size={theme.iconSize.md}
                        color={theme.colors.text}
                    />
                </Pressable>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Pressable onPress={handleSearch}>
                    <SearchBar
                        placeholder="Search titles, authors, or genres..."
                    />
                </Pressable>
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
                            key={genre.id || genre.title}
                            label={genre.title}
                            isSelected={selectedGenre === index}
                            onPress={() => handleGenrePress(index)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                removeClippedSubviews={true}
                scrollEventThrottle={16}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* Author Spotlight */}
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

                {/* Trending Now */}
                {trendingStories.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader
                            title="Trending Now"
                            onActionPress={handleTrendingActionPress}
                        />
                        <FlatList
                            data={trendingStories}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.trendingCarouselContent}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => (
                                <TrendingCard
                                    story={item}
                                    index={index}
                                    onPress={() => handleStoryPress(item.id)}
                                    onBookmarkPress={() => handleBookmarkPress(item)}
                                    isBookmarked={libraryActions.isInLibrary(item.id)}
                                />
                            )}
                            ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                            removeClippedSubviews={true}
                            initialNumToRender={3}
                            maxToRenderPerBatch={2}
                            windowSize={5}
                            updateCellsBatchingPeriod={50}
                        />
                    </View>
                )}

                {/* Explore Genres */}
                {categoriesData && categoriesData.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader 
                            title="Explore Genres"
                            onActionPress={() => {
                                haptics.selection();
                                // Could navigate to all categories page
                            }}
                        />
                        <View style={styles.sectionContent}>
                            <View style={styles.genreGrid}>
                                {categoriesData.slice(0, 4).map((category: { _id: string; title: string; icon?: string; color?: string; storyCount?: number }) => {
                                    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
                                        'book': 'book-outline',
                                        'mystery': 'search-outline',
                                        'adventure': 'compass-outline',
                                        'romance': 'heart-outline',
                                        'fantasy': 'sparkles-outline',
                                        'horror': 'moon-outline',
                                        'sci-fi': 'rocket-outline',
                                        'classics': 'library-outline',
                                    };
                                    const defaultIcon = 'book-outline';
                                    const iconName = category.icon && iconMap[category.icon.toLowerCase()] 
                                        ? iconMap[category.icon.toLowerCase()] 
                                        : defaultIcon;
                                    
                                    return (
                                        <Pressable
                                            key={category._id}
                                            style={({ pressed }) => [
                                                styles.genreCard,
                                                pressed && styles.genreCardPressed,
                                            ]}
                                            onPress={() => {
                                                haptics.selection();
                                                router.push(`/category/${category._id}?title=${encodeURIComponent(category.title)}`);
                                            }}
                                            accessibilityRole="button"
                                            accessibilityLabel={`${category.title} category`}
                                            accessibilityHint={`Double tap to view ${category.title} stories`}
                                        >
                                            <View style={styles.genreCardContent}>
                                                <Text style={styles.genreCardTitle}>{category.title}</Text>
                                                <Text style={styles.genreCardSubtitle}>
                                                    {category.storyCount || 0} {category.storyCount === 1 ? 'story' : 'stories'}
                                                </Text>
                                            </View>
                                            <Ionicons
                                                name={iconName}
                                                size={60}
                                                color={category.color ? `${category.color}15` : 'rgba(0, 0, 0, 0.05)'}
                                                style={styles.genreCardIcon}
                                            />
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>
                    </View>
                )}

                {/* Recommended For You */}
                {recommendedStories.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader 
                            title="Recommended For You"
                            onActionPress={() => {
                                haptics.selection();
                                // Could navigate to all recommended stories
                            }}
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
                            removeClippedSubviews={true}
                            initialNumToRender={5}
                            maxToRenderPerBatch={3}
                            windowSize={5}
                            updateCellsBatchingPeriod={50}
                        />
                    </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
    },
    notificationButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
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
    trendingCarouselContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.xs,
    },
    genreGrid: {
        flexDirection: 'row',
        gap: theme.spacing.md,
    },
    genreCard: {
        flex: 1,
        height: 96,
        borderRadius: theme.radius.lg,
        padding: theme.spacing.lg,
        justifyContent: 'center',
        overflow: 'hidden',
        ...theme.shadows.sm,
    },
    genreCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    genreCardContent: {
        zIndex: 1,
    },
    genreClassics: {
        backgroundColor: 'rgba(234, 42, 51, 0.08)',
    },
    genreMystery: {
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
    },
    genreCardTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    genreCardSubtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    genreCardIcon: {
        position: 'absolute',
        right: -10,
        bottom: -10,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
}));
