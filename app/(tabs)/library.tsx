import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, Pressable, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar } from '@/components';
import { LibraryItem } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';

export default function LibraryScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { items: libraryItems, isLoading, actions: libraryActions } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();

    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            libraryActions.fetchLibrary(),
            progressActions.fetchAllProgress(),
        ]);
        setRefreshing(false);
    }, [libraryActions, progressActions]);

    // Local type for library items with simplified progress info
    type LibraryItemWithProgress = Omit<LibraryItem, 'progress'> & {
        progress?: { percentage: number; isCompleted: boolean };
    };

    // Merge progress data with library items
    const libraryWithProgress: LibraryItemWithProgress[] = useMemo(() => {
        return libraryItems.map((item) => ({
            ...item,
            progress: progressMap[item.storyId] ? {
                percentage: progressMap[item.storyId].percentage,
                isCompleted: progressMap[item.storyId].isCompleted,
            } : undefined,
        }));
    }, [libraryItems, progressMap]);

    // Stats
    const stats = useMemo(() => {
        const total = libraryWithProgress.length;
        const completed = libraryWithProgress.filter((i) => i.progress?.isCompleted).length;
        const inProgress = libraryWithProgress.filter((i) => i.progress && !i.progress.isCompleted).length;
        return { total, completed, inProgress };
    }, [libraryWithProgress]);

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleReadPress = (storyId: string) => {
        router.push(`/reading/${storyId}`);
    };

    const renderItem = ({ item }: { item: LibraryItemWithProgress }) => {
        const progress = item.progress?.percentage || 0;
        const isCompleted = item.progress?.isCompleted || false;

        return (
            <Pressable
                style={styles.bookItem}
                onPress={() => handleStoryPress(item.storyId)}
            >
                <Image source={{ uri: item.story.coverImage }} style={styles.bookCover} />
                <View style={styles.bookInfo}>
                    <View style={styles.bookHeader}>
                        <View style={styles.bookTitleContainer}>
                            <Text style={styles.bookTitle} numberOfLines={1}>
                                {item.story.title}
                            </Text>
                            <Text style={styles.bookAuthor} numberOfLines={1}>
                                {item.story.author}
                            </Text>
                        </View>
                        <Pressable
                            style={styles.moreButton}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name="ellipsis-vertical"
                                size={theme.iconSize.sm}
                                color={theme.colors.textMuted}
                            />
                        </Pressable>
                    </View>

                    {/* Progress */}
                    <View style={styles.progressSection}>
                        {isCompleted ? (
                            <View style={styles.completedBadge}>
                                <Ionicons
                                    name="checkmark-circle"
                                    size={14}
                                    color={theme.colors.success}
                                />
                                <Text style={styles.completedText}>Completed</Text>
                            </View>
                        ) : progress > 0 ? (
                            <View style={styles.progressInfo}>
                                <ProgressBar progress={progress} height={6} />
                                <Text style={styles.progressText}>{progress}% complete</Text>
                            </View>
                        ) : (
                            <Text style={styles.notStartedText}>Not started</Text>
                        )}
                    </View>

                    {/* Action Button */}
                    <Pressable
                        style={styles.actionButton}
                        onPress={() => handleReadPress(item.storyId)}
                    >
                        <Ionicons
                            name={progress > 0 ? 'play' : 'book-outline'}
                            size={16}
                            color={theme.colors.primary}
                        />
                        <Text style={styles.actionButtonText}>
                            {progress > 0 ? 'Continue' : 'Start Reading'}
                        </Text>
                    </Pressable>
                </View>
            </Pressable>
        );
    };

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    // Check if user is anonymous - show limited message
    if (user?.isAnonymous) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <View style={styles.header}>
                    <Text style={styles.title}>My Library</Text>
                </View>
                <View style={styles.anonymousMessage}>
                    <Ionicons name="person-outline" size={64} color={theme.colors.textMuted} />
                    <Text style={styles.anonymousTitle}>Sign in to save books</Text>
                    <Text style={styles.anonymousSubtitle}>
                        Create an account to save books and track your reading progress
                    </Text>
                    <Pressable
                        style={styles.signInButton}
                        onPress={() => router.push('/login')}
                    >
                        <Text style={styles.signInButtonText}>Sign In</Text>
                    </Pressable>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>My Library</Text>
                <View style={styles.headerActions}>
                    <Pressable
                        style={styles.headerButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="search-outline"
                            size={theme.iconSize.md}
                            color={theme.colors.text}
                        />
                    </Pressable>
                    <Pressable
                        style={styles.headerButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="filter-outline"
                            size={theme.iconSize.md}
                            color={theme.colors.text}
                        />
                    </Pressable>
                </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.total}</Text>
                    <Text style={styles.statLabel}>Books</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.completed}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={styles.statValue}>{stats.inProgress}</Text>
                    <Text style={styles.statLabel}>In Progress</Text>
                </View>
            </View>

            {/* Book List */}
            <FlatList
                data={libraryWithProgress}
                keyExtractor={(item) => item.storyId}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons
                            name="book-outline"
                            size={64}
                            color={theme.colors.textMuted}
                        />
                        <Text style={styles.emptyTitle}>Your library is empty</Text>
                        <Text style={styles.emptySubtitle}>
                            Start reading to add books to your library
                        </Text>
                    </View>
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
        paddingVertical: theme.spacing.lg,
    },
    title: {
        fontSize: theme.typography.size.xxxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        letterSpacing: -0.5,
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
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        ...theme.shadows.sm,
    },
    statItem: {
        alignItems: 'center',
        gap: theme.spacing.xxs,
    },
    statValue: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    statLabel: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: theme.colors.border,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
    bookItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xl,
        padding: theme.spacing.md,
        gap: theme.spacing.lg,
        ...theme.shadows.sm,
    },
    bookCover: {
        width: 80,
        height: 120,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.borderLight,
    },
    bookInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    bookHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bookTitleContainer: {
        flex: 1,
        gap: 2,
    },
    bookTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    bookAuthor: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
    moreButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    progressSection: {
        paddingVertical: theme.spacing.sm,
    },
    progressInfo: {
        gap: theme.spacing.xs,
    },
    progressText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.xs,
    },
    completedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.success,
        fontWeight: theme.typography.weight.medium,
    },
    notStartedText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textMuted,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.xs,
        backgroundColor: `${theme.colors.primary}15`,
        height: 36,
        borderRadius: theme.radius.md,
    },
    actionButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.xxxxl,
        gap: theme.spacing.md,
    },
    emptyTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    emptySubtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    anonymousMessage: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
        gap: theme.spacing.md,
    },
    anonymousTitle: {
        fontSize: theme.typography.size.xl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    anonymousSubtitle: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    signInButton: {
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.radius.lg,
        marginTop: theme.spacing.md,
    },
    signInButtonText: {
        color: theme.colors.textInverse,
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.semibold,
    },
}));
