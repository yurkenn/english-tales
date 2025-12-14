import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, Image, ActivityIndicator } from 'react-native';
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
} from '@/components';
import { mockLibrary } from '@/data/mock';
import { useStories, useFeaturedStories, useCategories } from '@/hooks/useQueries';
import { Story } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { mapSanityStory } from '@/utils/storyMapper';

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
    const { data: categoriesData, isLoading: loadingCategories } = useCategories();
    const { data: featuredData, isLoading: loadingFeatured } = useFeaturedStories();
    const { data: storiesData, isLoading: loadingStories } = useStories();

    // Transform Categories
    const genres = useMemo(() => {
        const list = ['For You'];
        if (categoriesData) {
            list.push(...categoriesData.map((c: any) => c.title));
        }
        return list;
    }, [categoriesData]);

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

    // Get continue reading story (Still Mock for now as it depends on user progress)
    const continueReading = mockLibrary.find((item) => item.progress);

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleReadPress = (storyId: string) => {
        router.push(`/reading/${storyId}`);
    };

    const isLoading = loadingCategories || loadingFeatured || loadingStories;

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
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
                            onPress={() => setSelectedGenre(index)}
                        />
                    ))}
                </ScrollView>
            </View>

            {/* Main Content */}
            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
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
                                onBookmarkPress={() => { }}
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
