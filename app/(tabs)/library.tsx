import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, Pressable, Image, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LibraryScreenSkeleton, ProgressBar, EmptyState, StoryCardMenu, StoryCardMenuItem, ConfirmationDialog } from '@/components';
import BottomSheet from '@gorhom/bottom-sheet';
import { LibraryItem } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterType = 'all' | 'in-progress' | 'completed' | 'not-started';

export default function LibraryScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { items: libraryItems, isLoading, actions: libraryActions } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();
    const { actions: downloadActions } = useDownloadStore();

    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedItem, setSelectedItem] = useState<LibraryItemWithProgress | null>(null);
    const buttonRefs = useRef<{ [key: string]: View | null }>({});
    const removeFromLibraryDialogRef = useRef<BottomSheet>(null);
    const deleteDownloadDialogRef = useRef<BottomSheet>(null);

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

    // Filtered list based on filter state
    const filteredLibrary = useMemo(() => {
        switch (filter) {
            case 'completed':
                return libraryWithProgress.filter((i) => i.progress?.isCompleted);
            case 'in-progress':
                return libraryWithProgress.filter((i) => i.progress && i.progress.percentage > 0 && !i.progress.isCompleted);
            case 'not-started':
                return libraryWithProgress.filter((i) => !i.progress || i.progress.percentage === 0);
            default:
                return libraryWithProgress;
        }
    }, [libraryWithProgress, filter]);

    const cycleFilter = () => {
        haptics.selection();
        const filters: FilterType[] = ['all', 'in-progress', 'completed', 'not-started'];
        const currentIndex = filters.indexOf(filter);
        setFilter(filters[(currentIndex + 1) % filters.length]);
    };

    const getFilterLabel = () => {
        switch (filter) {
            case 'all': return 'All';
            case 'in-progress': return 'Reading';
            case 'completed': return 'Done';
            case 'not-started': return 'New';
        }
    };

    const handleStoryPress = (storyId: string) => {
        router.push(`/story/${storyId}`);
    };

    const handleReadPress = (storyId: string) => {
        router.push(`/reading/${storyId}`);
    };

    const handleMorePress = (item: LibraryItemWithProgress) => {
        haptics.selection();
        
        // Measure button position
        const buttonRef = buttonRefs.current[item.storyId];
        if (buttonRef) {
            buttonRef.measure((x, y, width, height, pageX, pageY) => {
                setMenuPosition({ x: pageX + width, y: pageY });
                setSelectedItem(item);
                setMenuVisible(true);
            });
        } else {
            // Fallback: set a default position
            setMenuPosition({ x: SCREEN_WIDTH - 220, y: 100 });
            setSelectedItem(item);
            setMenuVisible(true);
        }
    };

    const handleMenuClose = () => {
        setMenuVisible(false);
        setTimeout(() => {
            setSelectedItem(null);
        }, 200);
    };

    const getMenuItems = (): StoryCardMenuItem[] => {
        if (!selectedItem) return [];

        const isDownloaded = downloadActions.isDownloaded(selectedItem.storyId);
        const items: StoryCardMenuItem[] = [];

        if (isDownloaded) {
            items.push({
                label: 'Delete Download',
                icon: 'trash-outline',
                destructive: true,
                onPress: () => {
                    haptics.selection();
                    deleteDownloadDialogRef.current?.expand();
                },
            });
        }

        items.push({
            label: 'Remove from Library',
            icon: 'remove-circle-outline',
            destructive: true,
            onPress: () => {
                haptics.selection();
                removeFromLibraryDialogRef.current?.expand();
            },
        });

        return items;
    };

    const renderItem = useCallback(({ item }: { item: LibraryItemWithProgress }) => {
        const progress = item.progress?.percentage || 0;
        const isCompleted = item.progress?.isCompleted || false;
        const isDownloaded = downloadActions.isDownloaded(item.storyId);

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
                            {isDownloaded && (
                                <View style={styles.offlineBadge}>
                                    <Ionicons name="cloud-done" size={12} color={theme.colors.success} />
                                    <Text style={styles.offlineBadgeText}>Offline</Text>
                                </View>
                            )}
                        </View>
                        <View
                            ref={(ref) => {
                                buttonRefs.current[item.storyId] = ref;
                            }}
                            collapsable={false}
                        >
                            <Pressable
                                style={styles.moreButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                onPress={() => handleMorePress(item)}
                            >
                                <Ionicons
                                    name="ellipsis-vertical"
                                    size={theme.iconSize.sm}
                                    color={theme.colors.textMuted}
                                />
                            </Pressable>
                        </View>
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
    }, [theme, handleStoryPress, handleReadPress, handleMorePress, downloadActions]);

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LibraryScreenSkeleton />
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
                data={filteredLibrary}
                keyExtractor={(item) => item.storyId}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                removeClippedSubviews={true}
                initialNumToRender={10}
                maxToRenderPerBatch={5}
                windowSize={10}
                updateCellsBatchingPeriod={50}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <EmptyState
                        icon="book-outline"
                        title={filter === 'all' ? "Your library is empty" : `No ${getFilterLabel().toLowerCase()} books`}
                        message={filter === 'all' ? "Start reading to add books to your library" : "Try changing the filter"}
                        actionLabel={filter === 'all' ? "Discover Stories" : "Clear Filter"}
                        onAction={filter === 'all' ? () => router.push('/(tabs)/discover') : () => setFilter('all')}
                    />
                }
            />

            {/* Story Card Menu */}
            <StoryCardMenu
                visible={menuVisible}
                onClose={handleMenuClose}
                position={menuPosition}
                items={getMenuItems()}
            />

            {/* Confirmation Dialogs */}
            <ConfirmationDialog
                ref={removeFromLibraryDialogRef}
                title="Remove from Library"
                message={selectedItem ? `Remove "${selectedItem.story.title}" from your library?` : ''}
                confirmLabel="Remove"
                cancelLabel="Cancel"
                destructive
                icon="remove-circle-outline"
                onConfirm={async () => {
                    if (selectedItem) {
                        await libraryActions.removeFromLibrary(selectedItem.storyId);
                        haptics.success();
                        removeFromLibraryDialogRef.current?.close();
                        useToastStore.getState().actions.success('Removed from library');
                    }
                }}
                onCancel={() => removeFromLibraryDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={deleteDownloadDialogRef}
                title="Delete Download"
                message={selectedItem ? `Delete "${selectedItem.story.title}" download? It will no longer be available offline.` : ''}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                destructive
                icon="trash-outline"
                onConfirm={async () => {
                    if (selectedItem) {
                        await downloadActions.deleteDownload(selectedItem.storyId);
                        haptics.success();
                        deleteDownloadDialogRef.current?.close();
                        useToastStore.getState().actions.success('Download deleted');
                    }
                }}
                onCancel={() => deleteDownloadDialogRef.current?.close()}
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
    offlineBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    offlineBadgeText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.success,
        fontWeight: theme.typography.weight.medium,
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
