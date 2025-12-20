import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, Dimensions, Text, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
// - **Rankings Screen**: Beautiful leaderboard UI with trophy highlights and sticky personal rank.
// - **Real-time Sync**: Transparent background syncing of reading stats to Firestore.

// ### 7. Core Stability: Circular Dependency Resolution
// ,
import {
    LibraryScreenSkeleton,
    EmptyState,
    StoryCardMenu,
    StoryCardMenuItem,
    ConfirmationDialog,
    LibraryHeader,
    LibraryStatsRow,
    LibraryFilterBadge,
    LibraryBookCard,
    LibraryAnonymousState,
    VocabularyItem,
} from '@/components';
import {
    type LibraryItemWithProgress,
    type FilterType,
    FILTER_LABELS,
    FILTERS,
} from '@/components/molecules/moleculeTypes';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { useVocabularyStore } from '@/store/vocabularyStore';
// VocabularyItem already imported above
import { haptics } from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

import { useTranslation } from 'react-i18next';

export default function LibraryScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuthStore();
    const { items: libraryItems, isLoading, actions: libraryActions } = useLibraryStore();
    const { progressMap, actions: progressActions } = useProgressStore();
    const { actions: downloadActions } = useDownloadStore();

    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [viewMode, setViewMode] = useState<'stories' | 'vocabulary'>('stories');
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedItem, setSelectedItem] = useState<LibraryItemWithProgress | null>(null);
    const buttonRefs = useRef<{ [key: string]: View | null }>({});
    const removeFromLibraryDialogRef = useRef<BottomSheet>(null);
    const deleteDownloadDialogRef = useRef<BottomSheet>(null);

    const savedWords = useVocabularyStore((s) => s.savedWords);
    const vocabActions = useVocabularyStore((s) => s.actions);
    const wordList = useMemo(() => Object.values(savedWords).sort((a, b) => b.addedAt - a.addedAt), [savedWords]);

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
                label: t('library.menu.deleteDownload'),
                icon: 'trash-outline',
                destructive: true,
                onPress: () => {
                    haptics.selection();
                    deleteDownloadDialogRef.current?.expand();
                },
            });
        }

        items.push({
            label: t('library.menu.removeFromLibrary'),
            icon: 'remove-circle-outline',
            destructive: true,
            onPress: () => {
                haptics.selection();
                removeFromLibraryDialogRef.current?.expand();
            },
        });

        return items;
    }, [selectedItem, downloadActions, t]);

    const renderItem = useCallback(({ item, index }: { item: LibraryItemWithProgress; index: number }) => (
        <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
            <LibraryBookCard
                item={item}
                isDownloaded={downloadActions.isDownloaded(item.storyId)}
                onPress={() => handleStoryPress(item.storyId)}
                onReadPress={() => handleReadPress(item.storyId)}
                onMorePress={() => handleMorePress(item)}
                moreButtonRef={(ref: View | null) => { buttonRefs.current[item.storyId] = ref; }}
            />
        </Animated.View>
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

            <View style={styles.segmentedControl}>
                <Pressable
                    onPress={() => setViewMode('stories')}
                    style={[styles.segment, viewMode === 'stories' && styles.segmentActive]}
                >
                    <Text style={[styles.segmentText, viewMode === 'stories' && styles.segmentTextActive]}>
                        {t('library.tabs.stories') || 'Stories'}
                    </Text>
                </Pressable>
                <Pressable
                    onPress={() => setViewMode('vocabulary')}
                    style={[styles.segment, viewMode === 'vocabulary' && styles.segmentActive]}
                >
                    <Text style={[styles.segmentText, viewMode === 'vocabulary' && styles.segmentTextActive]}>
                        {t('library.tabs.vocabulary') || 'Vocabulary'}
                    </Text>
                    {wordList.length > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{wordList.length}</Text>
                        </View>
                    )}
                </Pressable>
            </View>

            {viewMode === 'stories' ? (
                <>
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
                                title={filter === 'all' ? t('library.empty') : t('common.error')}
                                message={filter === 'all' ? t('library.emptyMessage') : t('common.retry')}
                                actionLabel={filter === 'all' ? t('library.discoverStories') : t('common.retry')}
                                onAction={filter === 'all' ? () => router.push('/(tabs)/discover') : () => setFilter('all')}
                            />
                        }
                    />
                </>
            ) : (
                <FlatList
                    data={wordList}
                    keyExtractor={(word) => word.id}
                    renderItem={({ item, index }) => (
                        <Animated.View entering={FadeInDown.delay(index * 100).duration(500).springify()}>
                            <VocabularyItem
                                item={item}
                                onRemove={vocabActions.removeWord}
                            />
                        </Animated.View>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="bookmark-outline"
                            title={t('vocabulary.empty') || 'No words saved'}
                            message={t('vocabulary.emptyMessage') || 'Tap on unknown words while reading to save them here.'}
                            actionLabel={t('vocabulary.startReading') || 'Start Reading'}
                            onAction={() => router.push('/(tabs)')}
                        />
                    }
                />
            )}

            <StoryCardMenu
                visible={menuVisible}
                onClose={handleMenuClose}
                position={menuPosition}
                items={getMenuItems()}
            />

            <ConfirmationDialog
                ref={removeFromLibraryDialogRef}
                title={t('library.dialogs.removeTitle')}
                message={selectedItem ? t('library.dialogs.removeMessage', { title: selectedItem.story.title }) : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="remove-circle-outline"
                onConfirm={async () => {
                    if (selectedItem) {
                        await libraryActions.removeFromLibrary(selectedItem.storyId);
                        haptics.success();
                        removeFromLibraryDialogRef.current?.close();
                        useToastStore.getState().actions.success(t('common.save'));
                    }
                }}
                onCancel={() => removeFromLibraryDialogRef.current?.close()}
            />

            <ConfirmationDialog
                ref={deleteDownloadDialogRef}
                title={t('library.dialogs.deleteDownloadTitle')}
                message={selectedItem ? t('library.dialogs.deleteDownloadMessage', { title: selectedItem.story.title }) : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="trash-outline"
                onConfirm={async () => {
                    if (selectedItem) {
                        await downloadActions.deleteDownload(selectedItem.storyId);
                        haptics.success();
                        deleteDownloadDialogRef.current?.close();
                        useToastStore.getState().actions.success(t('common.delete'));
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
        paddingTop: theme.spacing.sm,
        paddingBottom: theme.spacing.xxxxl,
    },
    segmentedControl: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    segment: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: theme.colors.surface,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    segmentActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
        ...theme.shadows.md,
    },
    segmentText: {
        fontSize: theme.typography.size.md,
        fontWeight: 'bold',
        color: theme.colors.textSecondary,
    },
    segmentTextActive: {
        color: '#FFFFFF',
    },
    badge: {
        marginLeft: 6,
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
        minWidth: 18,
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
}));
