import { useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Platform, UIManager } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
    LibraryScreenSkeleton,
    EmptyState,
    StoryCardMenu,
    ConfirmationDialog,
    LibraryHeader,
    LibraryStatsRow,
    LibraryFilterBadge,
    LibraryBookCard,
    VocabularyItem,
} from '@/components';
import { SegmentTab, VocabQuizHeader } from '@/components/molecules/library';

import { useAuthStore } from '@/store/authStore';
import { useLibraryData, useLibraryActions } from '@/hooks';
import { useResponsiveGrid } from '@/hooks/useResponsiveGrid';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function LibraryScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { windowWidth } = useResponsiveGrid();
    const { user } = useAuthStore();

    // Data
    const {
        libraryWithProgress,
        stats,
        wordList,
        isLoading,
        libraryActions,
        progressActions,
        vocabActions,
    } = useLibraryData(user?.id);

    // Actions  
    const actions = useLibraryActions({
        libraryWithProgress,
        libraryActions,
        windowWidth,
    });

    // Refresh handler
    const onRefresh = useCallback(async () => {
        actions.setRefreshing(true);
        await Promise.all([libraryActions.fetchLibrary(), progressActions.fetchAllProgress()]);
        actions.setRefreshing(false);
    }, [libraryActions, progressActions, actions]);

    // Render items
    const renderLibraryItem = useCallback(
        ({ item, index }: { item: any; index: number }) => (
            <LibraryBookCard
                item={item}
                isDownloaded={actions.downloadActions.isDownloaded(item.storyId)}
                onPress={() => actions.handleStoryPress(item.storyId)}
                onReadPress={() => actions.handleReadPress(item.storyId)}
                onMorePress={() => actions.handleMorePress(item)}
                moreButtonRef={(ref: any) => { actions.buttonRefs.current[item.storyId] = ref; }}
                priority={index < 6 ? 'high' : 'normal'}
            />
        ),
        [actions]
    );

    const renderVocabularyItem = useCallback(
        ({ item }: { item: any }) => (
            <VocabularyItem
                item={item}
                onRemove={(wordId) => user?.id && vocabActions.removeWord(user.id, wordId)}
            />
        ),
        [user?.id, vocabActions]
    );

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LibraryScreenSkeleton />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LibraryHeader
                filter={actions.filter}
                onSearchPress={() => router.push('/search')}
                onFilterPress={actions.cycleFilter}
            />

            {/* Segmented Control */}
            <View style={styles.segmentedControl}>
                <SegmentTab
                    label={t('library.tabs.stories') || 'Stories'}
                    isActive={actions.viewMode === 'stories'}
                    onPress={() => actions.switchViewMode('stories')}
                />
                <SegmentTab
                    label={t('library.tabs.vocabulary') || 'Vocabulary'}
                    isActive={actions.viewMode === 'vocabulary'}
                    badge={wordList.length}
                    onPress={() => actions.switchViewMode('vocabulary')}
                />
            </View>

            {actions.viewMode === 'stories' ? (
                <>
                    <LibraryFilterBadge filter={actions.filter} onPress={actions.cycleFilter} />
                    <LibraryStatsRow total={stats.total} completed={stats.completed} inProgress={stats.inProgress} />

                    <FlatList
                        data={actions.filteredLibrary}
                        keyExtractor={(item) => item.storyId}
                        renderItem={renderLibraryItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        getItemLayout={(_, index) => ({
                            length: 152,
                            offset: 152 * index + (index * 16),
                            index,
                        })}
                        removeClippedSubviews
                        initialNumToRender={10}
                        maxToRenderPerBatch={5}
                        windowSize={10}
                        refreshControl={
                            <RefreshControl
                                refreshing={actions.refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.colors.primary}
                                colors={[theme.colors.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <EmptyState
                                icon="book-outline"
                                title={actions.filter === 'all' ? t('library.empty') : t('common.error')}
                                message={actions.filter === 'all' ? t('library.emptyMessage') : t('common.retry')}
                                actionLabel={actions.filter === 'all' ? t('library.discoverStories') : t('common.retry')}
                                onAction={actions.filter === 'all' ? () => router.push('/') : () => actions.setFilter('all')}
                            />
                        }
                    />
                </>
            ) : (
                <>
                    <VocabQuizHeader wordCount={wordList.length} />
                    <FlatList
                        data={wordList}
                        keyExtractor={(word) => word.id}
                        renderItem={renderVocabularyItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separatorSmall} />}
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
                </>
            )}

            <StoryCardMenu visible={actions.menuVisible} onClose={actions.handleMenuClose} position={actions.menuPosition} items={actions.getMenuItems()} />

            {/* Confirmation Dialogs */}
            {actions.selectedItem && (
                <>
                    <ConfirmationDialog
                        ref={actions.removeDialogRef}
                        title={t('library.dialogs.removeTitle')}
                        message={t('library.dialogs.removeMessage', { title: actions.selectedItem.story.title })}
                        confirmLabel={t('common.delete')}
                        cancelLabel={t('common.cancel')}
                        destructive
                        icon="remove-circle-outline"
                        onConfirm={actions.handleRemoveFromLibrary}
                        onCancel={() => actions.removeDialogRef.current?.close()}
                    />

                    <ConfirmationDialog
                        ref={actions.deleteDownloadDialogRef}
                        title={t('library.dialogs.deleteDownloadTitle')}
                        message={t('library.dialogs.deleteDownloadMessage', { title: actions.selectedItem.story.title })}
                        confirmLabel={t('common.delete')}
                        cancelLabel={t('common.cancel')}
                        destructive
                        icon="trash-outline"
                        onConfirm={actions.handleDeleteDownload}
                        onCancel={() => actions.deleteDownloadDialogRef.current?.close()}
                    />
                </>
            )}
        </View>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        listContent: {
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.sm,
            paddingBottom: theme.spacing.xxxxl * 2 + theme.spacing.xxl,
        },
        separator: {
            height: theme.spacing.lg,
        },
        separatorSmall: {
            height: theme.spacing.md,
        },
        segmentedControl: {
            flexDirection: 'row',
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
            gap: theme.spacing.sm,
        },
    });
}
