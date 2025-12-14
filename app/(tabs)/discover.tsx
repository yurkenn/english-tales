import React, { useState } from 'react';
import { View, Text, ScrollView, FlatList, Pressable, ImageBackground } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
    SearchBar,
    GenreChip,
    SectionHeader,
    BookCard,
    BookListItem,
} from '@/components';
import {
    genres,
    featuredAuthor,
    trendingStories,
    recommendedStories,
} from '@/data/mock';

export default function DiscoverScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [selectedGenre, setSelectedGenre] = useState(0);

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleSearch = () => {
        router.push('/search');
    };

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
                    {['All', ...genres.slice(1)].map((genre, index) => (
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
                {/* Author Spotlight */}
                <View style={styles.section}>
                    <SectionHeader title="Author Spotlight" />
                    <View style={styles.sectionContent}>
                        <Pressable style={styles.spotlightCard}>
                            <ImageBackground
                                source={{ uri: featuredAuthor.imageUrl }}
                                style={styles.spotlightImage}
                                resizeMode="cover"
                            >
                                <LinearGradient
                                    colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                                    style={styles.spotlightGradient}
                                />
                                <View style={styles.spotlightContent}>
                                    <View style={styles.featuredBadge}>
                                        <Text style={styles.featuredBadgeText}>Featured</Text>
                                    </View>
                                    <Text style={styles.spotlightName}>{featuredAuthor.name}</Text>
                                    <Text style={styles.spotlightBio} numberOfLines={2}>
                                        {featuredAuthor.bio}
                                    </Text>
                                    <Pressable style={styles.spotlightButton}>
                                        <Text style={styles.spotlightButtonText}>Read Now</Text>
                                        <Ionicons
                                            name="arrow-forward"
                                            size={14}
                                            color={theme.colors.text}
                                        />
                                    </Pressable>
                                </View>
                            </ImageBackground>
                        </Pressable>
                    </View>
                </View>

                {/* Trending Now */}
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
                <View style={styles.section}>
                    <SectionHeader title="Recommended For You" />
                    <View style={styles.sectionContent}>
                        {recommendedStories.slice(0, 3).map((story) => (
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
    spotlightCard: {
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.lg,
    },
    spotlightImage: {
        aspectRatio: 4 / 3,
        justifyContent: 'flex-end',
    },
    spotlightGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    spotlightContent: {
        padding: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    featuredBadge: {
        alignSelf: 'flex-start',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radius.sm,
    },
    featuredBadgeText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.xs,
        fontWeight: theme.typography.weight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    spotlightName: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
    spotlightBio: {
        fontSize: theme.typography.size.md,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
    spotlightButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        backgroundColor: theme.colors.textInverse,
        height: 44,
        borderRadius: theme.radius.lg,
        marginTop: theme.spacing.sm,
    },
    spotlightButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
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
}));
