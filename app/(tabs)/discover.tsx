import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
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
} from '@/components';
import { useStories, useFeaturedAuthor, useCategories } from '@/hooks/useQueries';
import { urlFor } from '@/services/sanity/client';
import { mapSanityStory } from '@/utils/storyMapper';
import { Story } from '@/types';
import { haptics } from '@/utils/haptics';

export default function DiscoverScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedGenre, setSelectedGenre] = useState(0);

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

    // Difficulty-based genre filters + Authors
    const genres = ['All', 'Easy', 'Medium', 'Hard', 'Authors'];

    const handleGenrePress = useCallback((index: number) => {
        haptics.selection();

        // Authors chip - navigate to authors page
        if (index === 4) {
            router.push('/authors');
            return;
        }

        setSelectedGenre(index);
    }, [router]);

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

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleSearch = () => {
        router.push('/search');
    };

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
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
                            key={genre}
                            label={genre}
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
                            onActionPress={() => { }}
                        />
                        <FlatList
                            data={trendingStories}
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
                )}

                {/* Explore Genres */}
                <View style={styles.section}>
                    <SectionHeader title="Explore Genres" />
                    <View style={styles.sectionContent}>
                        <View style={styles.genreGrid}>
                            <Pressable style={[styles.genreCard, styles.genreClassics]}>
                                <View>
                                    <Text style={styles.genreCardTitle}>Classics</Text>
                                    <Text style={styles.genreCardSubtitle}>Timeless tales</Text>
                                </View>
                                <Ionicons
                                    name="book-outline"
                                    size={60}
                                    color="rgba(234, 42, 51, 0.08)"
                                    style={styles.genreCardIcon}
                                />
                            </Pressable>
                            <Pressable style={[styles.genreCard, styles.genreMystery]}>
                                <View>
                                    <Text style={styles.genreCardTitle}>Mystery</Text>
                                    <Text style={styles.genreCardSubtitle}>Solve the case</Text>
                                </View>
                                <Ionicons
                                    name="search-outline"
                                    size={60}
                                    color="rgba(99, 102, 241, 0.08)"
                                    style={styles.genreCardIcon}
                                />
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Recommended For You */}
                {recommendedStories.length > 0 && (
                    <View style={styles.section}>
                        <SectionHeader title="Recommended For You" />
                        <View style={styles.sectionContent}>
                            {recommendedStories.slice(0, 3).map((story: Story) => (
                                <BookListItem
                                    key={story.id}
                                    story={story}
                                    onPress={() => handleStoryPress(story.id)}
                                    onBookmarkPress={() => { }}
                                />
                            ))}
                        </View>
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
