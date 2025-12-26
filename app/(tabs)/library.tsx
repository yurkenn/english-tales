import React, { useMemo, useState, useCallback, useRef } from 'react'
import { View, FlatList, RefreshControl, Dimensions, Text, Pressable } from 'react-native'
import { StyleSheet, useUnistyles } from 'react-native-unistyles'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import BottomSheet from '@gorhom/bottom-sheet'
import { useTranslation } from 'react-i18next'
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
    VocabularyItem,
} from '@/components'
import {
    type LibraryItemWithProgress,
    type FilterType,
    FILTERS,
} from '@/components/molecules/moleculeTypes'
import { useAuthStore } from '@/store/authStore'
import { useLibraryStore } from '@/store/libraryStore'
import { useProgressStore } from '@/store/progressStore'
import { useDownloadStore } from '@/store/downloadStore'
import { useToastStore } from '@/store/toastStore'
import { useVocabularyStore } from '@/store/vocabularyStore'
import { haptics } from '@/utils/haptics'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Segmented Tab Component
interface SegmentTabProps {
    label: string
    isActive: boolean
    badge?: number
    onPress: () => void
}

const SegmentTab = ({ label, isActive, badge, onPress }: SegmentTabProps) => (
    <Pressable onPress={onPress} style={[styles.segment, isActive && styles.segmentActive]}>
        <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
        {badge !== undefined && badge > 0 && (
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{badge}</Text>
            </View>
        )}
    </Pressable>
)

export default function LibraryScreen() {
    const { t } = useTranslation()
    const { theme } = useUnistyles()
    const router = useRouter()
    const insets = useSafeAreaInsets()
    const { user } = useAuthStore()
    const { items: libraryItems, isLoading, actions: libraryActions } = useLibraryStore()
    const { progressMap, actions: progressActions } = useProgressStore()
    const { actions: downloadActions } = useDownloadStore()

    // State
    const [refreshing, setRefreshing] = useState(false)
    const [filter, setFilter] = useState<FilterType>('all')
    const [viewMode, setViewMode] = useState<'stories' | 'vocabulary'>('stories')
    const [menuVisible, setMenuVisible] = useState(false)
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [selectedItem, setSelectedItem] = useState<LibraryItemWithProgress | null>(null)

    // Refs
    const buttonRefs = useRef<{ [key: string]: View | null }>({})
    const removeFromLibraryDialogRef = useRef<BottomSheet>(null)
    const deleteDownloadDialogRef = useRef<BottomSheet>(null)

    // Vocabulary data
    const savedWordsForUser = useVocabularyStore((s) => s.savedWords[user?.id || ''] || {})
    const vocabActions = useVocabularyStore((s) => s.actions)
    const wordList = useMemo(
        () => Object.values(savedWordsForUser).sort((a, b) => b.addedAt - a.addedAt),
        [savedWordsForUser]
    )

    // Merge progress data with library items
    const libraryWithProgress = useMemo<LibraryItemWithProgress[]>(() => {
        return libraryItems.map((item) => ({
            ...item,
            progress: progressMap[item.storyId]
                ? {
                    percentage: progressMap[item.storyId].percentage,
                    isCompleted: progressMap[item.storyId].isCompleted,
                }
                : undefined,
        }))
    }, [libraryItems, progressMap])

    // Stats
    const stats = useMemo(() => {
        const total = libraryWithProgress.length
        const completed = libraryWithProgress.filter((i) => i.progress?.isCompleted).length
        const inProgress = libraryWithProgress.filter((i) => i.progress && !i.progress.isCompleted).length
        return { total, completed, inProgress }
    }, [libraryWithProgress])

    // Filtered list
    const filteredLibrary = useMemo(() => {
        switch (filter) {
            case 'completed':
                return libraryWithProgress.filter((i) => i.progress?.isCompleted)
            case 'in-progress':
                return libraryWithProgress.filter((i) => i.progress && i.progress.percentage > 0 && !i.progress.isCompleted)
            case 'not-started':
                return libraryWithProgress.filter((i) => !i.progress || i.progress.percentage === 0)
            default:
                return libraryWithProgress
        }
    }, [libraryWithProgress, filter])

    // Handlers
    const onRefresh = useCallback(async () => {
        setRefreshing(true)
        await Promise.all([libraryActions.fetchLibrary(), progressActions.fetchAllProgress()])
        setRefreshing(false)
    }, [libraryActions, progressActions])

    const cycleFilter = useCallback(() => {
        haptics.selection()
        const currentIndex = FILTERS.indexOf(filter)
        setFilter(FILTERS[(currentIndex + 1) % FILTERS.length])
    }, [filter])

    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router])
    const handleReadPress = useCallback((storyId: string) => router.push(`/reading/${storyId}`), [router])

    const handleMorePress = useCallback((item: LibraryItemWithProgress) => {
        haptics.selection()
        const buttonRef = buttonRefs.current[item.storyId]
        if (buttonRef) {
            buttonRef.measure((x, y, width, height, pageX, pageY) => {
                setMenuPosition({ x: pageX + width, y: pageY })
                setSelectedItem(item)
                setMenuVisible(true)
            })
        } else {
            setMenuPosition({ x: SCREEN_WIDTH - 220, y: 100 })
            setSelectedItem(item)
            setMenuVisible(true)
        }
    }, [])

    const handleMenuClose = useCallback(() => {
        setMenuVisible(false)
        setTimeout(() => setSelectedItem(null), 200)
    }, [])

    const getMenuItems = useCallback((): StoryCardMenuItem[] => {
        if (!selectedItem) return []
        const isDownloaded = downloadActions.isDownloaded(selectedItem.storyId)
        const items: StoryCardMenuItem[] = []

        if (isDownloaded) {
            items.push({
                label: t('library.menu.deleteDownload'),
                icon: 'trash-outline',
                destructive: true,
                onPress: () => {
                    haptics.selection()
                    deleteDownloadDialogRef.current?.expand()
                },
            })
        }

        items.push({
            label: t('library.menu.removeFromLibrary'),
            icon: 'remove-circle-outline',
            destructive: true,
            onPress: () => {
                haptics.selection()
                removeFromLibraryDialogRef.current?.expand()
            },
        })

        return items
    }, [selectedItem, downloadActions, t])

    // Dialog handlers
    const handleRemoveFromLibrary = useCallback(async () => {
        if (!selectedItem) return
        await libraryActions.removeFromLibrary(selectedItem.storyId)
        haptics.success()
        removeFromLibraryDialogRef.current?.close()
        useToastStore.getState().actions.success(t('common.save'))
    }, [selectedItem, libraryActions, t])

    const handleDeleteDownload = useCallback(async () => {
        if (!selectedItem) return
        await downloadActions.deleteDownload(selectedItem.storyId)
        haptics.success()
        deleteDownloadDialogRef.current?.close()
        useToastStore.getState().actions.success(t('common.delete'))
    }, [selectedItem, downloadActions, t])

    // Render items
    const renderLibraryItem = useCallback(
        ({ item }: { item: LibraryItemWithProgress }) => (
            <LibraryBookCard
                item={item}
                isDownloaded={downloadActions.isDownloaded(item.storyId)}
                onPress={() => handleStoryPress(item.storyId)}
                onReadPress={() => handleReadPress(item.storyId)}
                onMorePress={() => handleMorePress(item)}
                moreButtonRef={(ref: View | null) => { buttonRefs.current[item.storyId] = ref }}
            />
        ),
        [downloadActions, handleStoryPress, handleReadPress, handleMorePress]
    )

    const renderVocabularyItem = useCallback(
        ({ item }: { item: any }) => (
            <VocabularyItem
                item={item}
                onRemove={(wordId) => user?.id && vocabActions.removeWord(user.id, wordId)}
            />
        ),
        [user?.id, vocabActions]
    )

    // Loading state
    if (isLoading) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }]}>
                <LibraryScreenSkeleton />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <LibraryHeader
                filter={filter}
                onSearchPress={() => router.push('/search')}
                onFilterPress={cycleFilter}
            />

            {/* Segmented Control */}
            <View style={styles.segmentedControl}>
                <SegmentTab
                    label={t('library.tabs.stories') || 'Stories'}
                    isActive={viewMode === 'stories'}
                    onPress={() => setViewMode('stories')}
                />
                <SegmentTab
                    label={t('library.tabs.vocabulary') || 'Vocabulary'}
                    isActive={viewMode === 'vocabulary'}
                    badge={wordList.length}
                    onPress={() => setViewMode('vocabulary')}
                />
            </View>

            {viewMode === 'stories' ? (
                <>
                    <LibraryFilterBadge filter={filter} onPress={cycleFilter} />
                    <LibraryStatsRow total={stats.total} completed={stats.completed} inProgress={stats.inProgress} />

                    <FlatList
                        data={filteredLibrary}
                        keyExtractor={(item) => item.storyId}
                        renderItem={renderLibraryItem}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                        ItemSeparatorComponent={() => <View style={styles.separator} />}
                        removeClippedSubviews
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
                <>
                    {/* Quiz Button Header for Vocabulary */}
                    {wordList.length >= 3 && (
                        <Pressable
                            onPress={() => { haptics.medium(); router.push('/user/quiz') }}
                            style={styles.quizHeader}
                        >
                            <View style={styles.quizHeaderContent}>
                                <View style={styles.quizHeaderIcon}>
                                    <Text style={{ fontSize: 18 }}>🎴</Text>
                                </View>
                                <View style={styles.quizHeaderText}>
                                    <Text style={styles.quizHeaderTitle}>{t('library.quizTitle', 'Practice Quiz')}</Text>
                                    <Text style={styles.quizHeaderSubtitle}>
                                        {t('library.quizSubtitle', '{{count}} words to practice', { count: wordList.length })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.quizHeaderArrow}>
                                <Text style={{ fontSize: 20 }}>→</Text>
                            </View>
                        </Pressable>
                    )}
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

            <StoryCardMenu visible={menuVisible} onClose={handleMenuClose} position={menuPosition} items={getMenuItems()} />

            <ConfirmationDialog
                ref={removeFromLibraryDialogRef}
                title={t('library.dialogs.removeTitle')}
                message={selectedItem ? t('library.dialogs.removeMessage', { title: selectedItem.story.title }) : ''}
                confirmLabel={t('common.delete')}
                cancelLabel={t('common.cancel')}
                destructive
                icon="remove-circle-outline"
                onConfirm={handleRemoveFromLibrary}
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
                onConfirm={handleDeleteDownload}
                onCancel={() => deleteDownloadDialogRef.current?.close()}
            />
        </View>
    )
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    listContent: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.sm,
        paddingBottom: 120,
    },
    separator: {
        height: 16,
    },
    separatorSmall: {
        height: 12,
    },
    segmentedControl: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 12,
        gap: 8,
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
        fontWeight: '600',
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
        fontSize: theme.typography.size.xs,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    quizHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        marginHorizontal: theme.spacing.lg,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        padding: theme.spacing.md,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.borderLight,
        ...theme.shadows.sm,
    },
    quizHeaderContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    quizHeaderIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primary + '10',
        alignItems: 'center',
        justifyContent: 'center',
    },
    quizHeaderText: {
        gap: 2,
    },
    quizHeaderTitle: {
        fontSize: theme.typography.size.md,
        fontWeight: '700',
        color: theme.colors.text,
    },
    quizHeaderSubtitle: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textSecondary,
    },
    quizHeaderArrow: {
        color: theme.colors.primary,
        opacity: 0.5,
    },
}))
