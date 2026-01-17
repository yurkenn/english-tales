import { useState, useCallback, useRef, useMemo } from 'react';
import { LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';
import { useTranslation } from 'react-i18next';

import { useDownloadStore } from '@/store/downloadStore';
import { useToastStore } from '@/store/toastStore';
import { haptics } from '@/utils/haptics';
import type { LibraryItemWithProgress, FilterType } from '@/components/molecules/moleculeTypes';
import type { StoryCardMenuItem } from '@/components/organisms/StoryCardMenu';

const FILTERS: FilterType[] = ['all', 'in-progress', 'completed', 'not-started'];

interface UseLibraryActionsProps {
    libraryWithProgress: LibraryItemWithProgress[];
    libraryActions: any;
    windowWidth: number;
}

/**
 * Custom hook for library action handlers and state.
 */
export function useLibraryActions({
    libraryWithProgress,
    libraryActions,
    windowWidth,
}: UseLibraryActionsProps) {
    const { t } = useTranslation();
    const router = useRouter();
    const { actions: downloadActions } = useDownloadStore();

    // State
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [viewMode, setViewMode] = useState<'stories' | 'vocabulary'>('stories');
    const [menuVisible, setMenuVisible] = useState(false);
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
    const [selectedItem, setSelectedItem] = useState<LibraryItemWithProgress | null>(null);

    // Refs
    const buttonRefs = useRef<{ [key: string]: any }>({});
    const removeDialogRef = useRef<BottomSheet>(null);
    const deleteDownloadDialogRef = useRef<BottomSheet>(null);

    // Filtered list
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

    // Handlers
    const cycleFilter = useCallback(() => {
        haptics.selection();
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        const currentIndex = FILTERS.indexOf(filter);
        setFilter(FILTERS[(currentIndex + 1) % FILTERS.length]);
    }, [filter]);

    const handleStoryPress = useCallback((storyId: string) => router.push(`/story/${storyId}`), [router]);
    const handleReadPress = useCallback((storyId: string) => router.push(`/reading/${storyId}`), [router]);

    const handleMorePress = useCallback((item: LibraryItemWithProgress) => {
        haptics.selection();
        const buttonRef = buttonRefs.current[item.storyId];
        if (buttonRef) {
            buttonRef.measure((_x: number, _y: number, width: number, _height: number, pageX: number, pageY: number) => {
                setMenuPosition({ x: pageX + width, y: pageY });
                setSelectedItem(item);
                setMenuVisible(true);
            });
        } else {
            setMenuPosition({ x: windowWidth - 220, y: 100 });
            setSelectedItem(item);
            setMenuVisible(true);
        }
    }, [windowWidth]);

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
                removeDialogRef.current?.expand();
            },
        });

        return items;
    }, [selectedItem, downloadActions, t]);

    const handleRemoveFromLibrary = useCallback(async () => {
        if (!selectedItem) return;
        await libraryActions.removeFromLibrary(selectedItem.storyId);
        haptics.success();
        removeDialogRef.current?.close();
        useToastStore.getState().actions.success(t('common.save'));
    }, [selectedItem, libraryActions, t]);

    const handleDeleteDownload = useCallback(async () => {
        if (!selectedItem) return;
        await downloadActions.deleteDownload(selectedItem.storyId);
        haptics.success();
        deleteDownloadDialogRef.current?.close();
        useToastStore.getState().actions.success(t('common.delete'));
    }, [selectedItem, downloadActions, t]);

    const switchViewMode = useCallback((mode: 'stories' | 'vocabulary') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setViewMode(mode);
    }, []);

    return {
        // State
        refreshing,
        setRefreshing,
        filter,
        setFilter,
        viewMode,
        menuVisible,
        menuPosition,
        selectedItem,
        filteredLibrary,

        // Refs
        buttonRefs,
        removeDialogRef,
        deleteDownloadDialogRef,

        // Handlers
        cycleFilter,
        handleStoryPress,
        handleReadPress,
        handleMorePress,
        handleMenuClose,
        getMenuItems,
        handleRemoveFromLibrary,
        handleDeleteDownload,
        switchViewMode,
        downloadActions,
    };
}
