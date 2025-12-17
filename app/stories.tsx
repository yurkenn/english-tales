import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Image, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NetworkError, EmptyState } from '@/components';
import { useStories } from '@/hooks/useQueries';
import { mapSanityStory } from '@/utils/storyMapper';
import { useLibraryStore } from '@/store/libraryStore';
import { haptics } from '@/utils/haptics';
import { Story } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 12;
const HORIZONTAL_PADDING = 16;
const CARD_WIDTH = (SCREEN_WIDTH - HORIZONTAL_PADDING * 2 - CARD_GAP) / 2;
const CARD_IMAGE_HEIGHT = CARD_WIDTH * 1.5;

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function StoriesScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [filter, setFilter] = useState<DifficultyFilter>('all');
    const [refreshing, setRefreshing] = useState(false);

    const { data: storiesData, isLoading, isError, refetch } = useStories();
    const { actions: libraryActions } = useLibraryStore();

    const allStories = useMemo(() => {
        return storiesData?.map(mapSanityStory) || [];
    }, [storiesData]);

    const filteredStories = useMemo(() => {
        if (filter === 'all') return allStories;
        return allStories.filter((s: Story) => s.difficulty === filter);
    }, [allStories, filter]);

    // Stats
    const stats = useMemo(() => {
        const total = allStories.length;
        const beginner = allStories.filter((s: Story) => s.difficulty === 'beginner').length;
        const intermediate = allStories.filter((s: Story) => s.difficulty === 'intermediate').length;
        const advanced = allStories.filter((s: Story) => s.difficulty === 'advanced').length;
        return { total, beginner, intermediate, advanced };
    }, [allStories]);

    const handleStoryPress = useCallback((storyId: string) => {
        haptics.light();
        router.push(`/story/${storyId}`);
    }, [router]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const cycleFilter = () => {
        haptics.selection();
        const filters: DifficultyFilter[] = ['all', 'beginner', 'intermediate', 'advanced'];
        const currentIndex = filters.indexOf(filter);
        setFilter(filters[(currentIndex + 1) % filters.length]);
    };

    const getFilterLabel = () => {
        switch (filter) {
            case 'all': return 'All';
            case 'beginner': return 'Easy';
            case 'intermediate': return 'Medium';
            case 'advanced': return 'Hard';
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return '#10B981';
            case 'intermediate': return '#F59E0B';
            case 'advanced': return '#EF4444';
            default: return theme.colors.textMuted;
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner': return 'Easy';
            case 'intermediate': return 'Medium';
            case 'advanced': return 'Hard';
            default: return difficulty;
        }
    };

    const renderItem = useCallback(({ item }: { item: Story }) => {
        const isInLibrary = libraryActions.isInLibrary(item.id);

        return (
            <Pressable
                style={({ pressed }) => [
                    styles.bookCard,
                    pressed && styles.bookCardPressed,
                ]}
                onPress={() => handleStoryPress(item.id)}
            >
                {/* Cover Image */}
                <View style={styles.coverContainer}>
                    <Image
                        source={{ uri: item.coverImage || 'https://via.placeholder.com/200x300' }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />

                    {/* Gradient Overlay */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />

                    {/* Top Badges */}
                    <View style={styles.topBadges}>
                        <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(item.difficulty) }]}>
                            <Text style={styles.difficultyText}>
                                {getDifficultyLabel(item.difficulty)}
                            </Text>
                        </View>
                        {isInLibrary && (
                            <View style={styles.libraryBadge}>
                                <Ionicons name="bookmark" size={12} color="#FFFFFF" />
                            </View>
                        )}
                    </View>

                    {/* Bottom Info Overlay */}
                    <View style={styles.overlayInfo}>
                        <Text style={styles.overlayTitle} numberOfLines={2}>
                            {item.title}
                        </Text>
                        <View style={styles.overlayMeta}>
                            <Text style={styles.overlayAuthor} numberOfLines={1}>
                                {item.author}
                            </Text>
                            <View style={styles.readTimeBadge}>
                                <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.readTimeText}>{item.estimatedReadTime}m</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Pressable>
        );
    }, [theme, handleStoryPress, libraryActions]);

    if (isError) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <NetworkError
                    message="Failed to load stories"
                    onRetry={refetch}
                />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={styles.title}>All Stories</Text>
                <View style={styles.headerActions}>
                    <Pressable
                        style={styles.headerButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => router.push('/search')}
                    >
                        <Ionicons
                            name="search-outline"
                            size={theme.iconSize.md}
                            color={theme.colors.text}
                        />
                    </Pressable>
                    <Pressable
                        style={[styles.headerButton, filter !== 'all' && styles.filterActive]}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={cycleFilter}
                    >
                        <Ionicons
                            name="filter-outline"
                            size={theme.iconSize.md}
                            color={filter !== 'all' ? theme.colors.primary : theme.colors.text}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Filter Badge */}
            {filter !== 'all' && (
                <View style={styles.filterBadgeRow}>
                    <Pressable style={styles.filterBadge} onPress={cycleFilter}>
                        <Text style={styles.filterBadgeText}>{getFilterLabel()}</Text>
                        <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                    </Pressable>
                </View>
            )}

            {/* Stats */}
            <View style={styles.statsRow}>
                <Pressable style={styles.statItem} onPress={() => { haptics.selection(); setFilter('all'); }}>
                    <Text style={[styles.statValue, filter === 'all' && styles.statValueActive]}>{stats.total}</Text>
                    <Text style={styles.statLabel}>All</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable style={styles.statItem} onPress={() => { haptics.selection(); setFilter('beginner'); }}>
                    <Text style={[styles.statValue, { color: filter === 'beginner' ? '#10B981' : theme.colors.text }]}>{stats.beginner}</Text>
                    <Text style={styles.statLabel}>Easy</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable style={styles.statItem} onPress={() => { haptics.selection(); setFilter('intermediate'); }}>
                    <Text style={[styles.statValue, { color: filter === 'intermediate' ? '#F59E0B' : theme.colors.text }]}>{stats.intermediate}</Text>
                    <Text style={styles.statLabel}>Medium</Text>
                </Pressable>
                <View style={styles.statDivider} />
                <Pressable style={styles.statItem} onPress={() => { haptics.selection(); setFilter('advanced'); }}>
                    <Text style={[styles.statValue, { color: filter === 'advanced' ? '#EF4444' : theme.colors.text }]}>{stats.advanced}</Text>
                    <Text style={styles.statLabel}>Hard</Text>
                </Pressable>
            </View>

            {/* Stories Grid */}
            <FlatList
                data={filteredStories}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.gridRow}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={6}
                windowSize={10}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    isLoading ? null : (
                        <EmptyState
                            icon="book-outline"
                            title="No stories found"
                            message="Try changing the filter to find stories."
                        />
                    )
                }
            />
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
        paddingVertical: theme.spacing.md,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    headerActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    headerButton: {
        width: theme.avatarSize.md,
        height: theme.avatarSize.md,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterActive: {
        backgroundColor: `${theme.colors.primary}15`,
    },
    filterBadgeRow: {
        paddingHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.md,
    },
    filterBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        backgroundColor: `${theme.colors.primary}15`,
        borderRadius: theme.radius.full,
    },
    filterBadgeText: {
        fontSize: theme.typography.size.sm,
        fontWeight: theme.typography.weight.medium,
        color: theme.colors.primary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: theme.spacing.sm,
    },
    statValue: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statValueActive: {
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 28,
        backgroundColor: theme.colors.border,
    },
    listContent: {
        paddingHorizontal: HORIZONTAL_PADDING,
        paddingBottom: theme.spacing.xxxl,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: CARD_GAP,
    },
    bookCard: {
        width: CARD_WIDTH,
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        ...theme.shadows.md,
    },
    bookCardPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    coverContainer: {
        position: 'relative',
        width: CARD_WIDTH,
        height: CARD_IMAGE_HEIGHT,
    },
    coverImage: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.borderLight,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: '60%',
    },
    topBadges: {
        position: 'absolute',
        top: 8,
        left: 8,
        right: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    difficultyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: theme.radius.full,
    },
    difficultyText: {
        fontSize: 10,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    libraryBadge: {
        width: 26,
        height: 26,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlayInfo: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: theme.spacing.sm,
    },
    overlayTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: '#FFFFFF',
        lineHeight: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    overlayMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    overlayAuthor: {
        flex: 1,
        fontSize: theme.typography.size.sm,
        color: 'rgba(255,255,255,0.85)',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    readTimeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: 'rgba(0,0,0,0.4)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: theme.radius.full,
    },
    readTimeText: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: theme.typography.weight.medium,
    },
}));
