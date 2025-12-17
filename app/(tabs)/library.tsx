import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, Dimensions } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import { LibraryScreenSkeleton, EmptyState, StoryCardMenu, StoryCardMenuItem, ConfirmationDialog } from '@/components';
import {
    LibraryHeader,
    LibraryStatsRow,
    LibraryFilterBadge,
    LibraryBookCard,
    LibraryAnonymousState,
    type LibraryItemWithProgress,
    type FilterType,
    FILTER_LABELS,
    FILTERS,
} from '@/components/library';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

    const cycleFilter = useCallback(() => {
        haptics.selection();
        const currentIndex = FILTERS.indexOf(filter);
        setFilter(FILTERS[(currentIndex + 1) % FILTERS.length]);
    }, [filter]);

    const handleStoryPress = useCallback((storyId: string) => {
        router.push(`/story/${storyId}`);
    }, [router]);

    const handleReadPress = useCallback((storyId: string) => {
        router.push(`/reading/${storyId}`);
    }, [router]);

    const handleMorePress = useCallback((item: LibraryItemWithProgress) => {
        haptics.selection();
        const buttonRef = buttonRefs.current[item.storyId];
        if (buttonRef) {
            buttonRef.measure((x, y, width, height, pageX, pageY) => {
                setMenuPosition({ x: pageX + width, y: pageY });
                setSelectedItem(item);
                setMenuVisible(true);
            });
        } else {
            setMenuPosition({ x: SCREEN_WIDTH - 220, y: 100 });
            setSelectedItem(item);
            setMenuVisible(true);
        }
    }, []);

    const handleMenuClose = useCallback(() => {
        setMenuVisible(false);
        setTimeout(() => setSelectedItem(null), 200);
    }, []);

    const getMenuItems = useCallback((): StoryCardMenuItem[] => {
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
    }, [selectedItem, downloadActions]);

    const renderItem = useCallback(({ item }: { item: LibraryItemWithProgress }) => (
        <LibraryBookCard
            item={item}
            isDownloaded={downloadActions.isDownloaded(item.storyId)}
            onPress={() => handleStoryPress(item.storyId)}
            onReadPress={() => handleReadPress(item.storyId)}
            onMorePress={() => handleMorePress(item)}
            moreButtonRef={(ref: View | null) => { buttonRefs.current[item.storyId] = ref; }}
        />
    ), [downloadActions, handleStoryPress, handleReadPress, handleMorePress]);

    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LibraryScreenSkeleton />
            </View>
        );
    }

    if (user?.isAnonymous) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LibraryHeader
                    filter={filter}
                    onSearchPress={() => router.push('/search')}
                    onFilterPress={cycleFilter}
                />
                <LibraryAnonymousState onSignInPress={() => router.push('/login')} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <LibraryHeader
                filter={filter}
                onSearchPress={() => router.push('/search')}
                onFilterPress={cycleFilter}
            />

            <LibraryFilterBadge filter={filter} onPress={cycleFilter} />

            <LibraryStatsRow
                total={stats.total}
                completed={stats.completed}
                inProgress={stats.inProgress}
            />

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
                        title={filter === 'all' ? "Your library is empty" : `No ${FILTER_LABELS[filter].toLowerCase()} books`}
                        message={filter === 'all' ? "Start reading to add books to your library" : "Try changing the filter"}
                        actionLabel={filter === 'all' ? "Discover Stories" : "Clear Filter"}
                        onAction={filter === 'all' ? () => router.push('/(tabs)/discover') : () => setFilter('all')}
                    />
                }
            />

            <StoryCardMenu
                visible={menuVisible}
                onClose={handleMenuClose}
                position={menuPosition}
                items={getMenuItems()}
            />

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
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxl,
    },
}));
