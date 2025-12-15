import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '@/types';
import { PortableTextBlock } from '@portabletext/types';

// Storage keys
const DOWNLOADS_KEY = '@english_tales_downloads';
const DOWNLOAD_CONTENT_PREFIX = '@english_tales_content_';

// Types
export interface DownloadedStory {
    storyId: string;
    story: Story;
    content: PortableTextBlock[];
    downloadedAt: Date;
    sizeBytes: number;
}

export type DownloadStatus = 'idle' | 'downloading' | 'downloaded' | 'error';

// State
interface DownloadState {
    downloads: Record<string, DownloadedStory>;
    downloadingIds: Set<string>;
    isLoading: boolean;
    error: string | null;
}

// Actions
interface DownloadActions {
    loadDownloads: () => Promise<void>;
    downloadStory: (story: Story, content: PortableTextBlock[]) => Promise<boolean>;
    deleteDownload: (storyId: string) => Promise<boolean>;
    isDownloaded: (storyId: string) => boolean;
    getDownloadedContent: (storyId: string) => PortableTextBlock[] | null;
    getDownloadStatus: (storyId: string) => DownloadStatus;
    getTotalDownloadSize: () => number;
    clearAllDownloads: () => Promise<void>;
}

// Initial state
const initialState: DownloadState = {
    downloads: {},
    downloadingIds: new Set(),
    isLoading: false,
    error: null,
};

export const useDownloadStore = create<DownloadState & { actions: DownloadActions }>()((set, get) => ({
    ...initialState,

    actions: {
        loadDownloads: async () => {
            set({ isLoading: true, error: null });
            try {
                const downloadsJson = await AsyncStorage.getItem(DOWNLOADS_KEY);
                if (downloadsJson) {
                    const downloadsArray: DownloadedStory[] = JSON.parse(downloadsJson);
                    const downloads: Record<string, DownloadedStory> = {};

                    downloadsArray.forEach((d) => {
                        downloads[d.storyId] = {
                            ...d,
                            downloadedAt: new Date(d.downloadedAt),
                        };
                    });

                    set({ downloads, isLoading: false });
                } else {
                    set({ isLoading: false });
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to load downloads';
                set({ isLoading: false, error: message });
            }
        },

        downloadStory: async (story, content) => {
            const { downloads, downloadingIds } = get();

            // Already downloaded
            if (downloads[story.id]) {
                return true;
            }

            // Already downloading
            if (downloadingIds.has(story.id)) {
                return false;
            }

            // Mark as downloading
            set((state) => ({
                downloadingIds: new Set([...state.downloadingIds, story.id]),
                error: null,
            }));

            try {
                // Calculate size
                const contentJson = JSON.stringify(content);
                const sizeBytes = new Blob([contentJson]).size;

                // Save content
                await AsyncStorage.setItem(
                    `${DOWNLOAD_CONTENT_PREFIX}${story.id}`,
                    contentJson
                );

                // Create download record
                const downloadedStory: DownloadedStory = {
                    storyId: story.id,
                    story,
                    content,
                    downloadedAt: new Date(),
                    sizeBytes,
                };

                // Update state
                const newDownloads = {
                    ...get().downloads,
                    [story.id]: downloadedStory,
                };

                // Persist downloads list (without content to save space)
                const downloadsToStore = Object.values(newDownloads).map((d) => ({
                    storyId: d.storyId,
                    story: d.story,
                    content: [], // Don't store content in main list
                    downloadedAt: d.downloadedAt,
                    sizeBytes: d.sizeBytes,
                }));
                await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloadsToStore));

                set((state) => {
                    const newDownloadingIds = new Set(state.downloadingIds);
                    newDownloadingIds.delete(story.id);
                    return {
                        downloads: newDownloads,
                        downloadingIds: newDownloadingIds,
                    };
                });

                return true;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to download story';
                set((state) => {
                    const newDownloadingIds = new Set(state.downloadingIds);
                    newDownloadingIds.delete(story.id);
                    return {
                        downloadingIds: newDownloadingIds,
                        error: message,
                    };
                });
                return false;
            }
        },

        deleteDownload: async (storyId) => {
            try {
                // Remove content
                await AsyncStorage.removeItem(`${DOWNLOAD_CONTENT_PREFIX}${storyId}`);

                // Update state
                const newDownloads = { ...get().downloads };
                delete newDownloads[storyId];

                // Persist
                const downloadsToStore = Object.values(newDownloads).map((d) => ({
                    storyId: d.storyId,
                    story: d.story,
                    content: [],
                    downloadedAt: d.downloadedAt,
                    sizeBytes: d.sizeBytes,
                }));
                await AsyncStorage.setItem(DOWNLOADS_KEY, JSON.stringify(downloadsToStore));

                set({ downloads: newDownloads });
                return true;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to delete download';
                set({ error: message });
                return false;
            }
        },

        isDownloaded: (storyId) => {
            return !!get().downloads[storyId];
        },

        getDownloadedContent: (storyId) => {
            const download = get().downloads[storyId];
            return download?.content || null;
        },

        getDownloadStatus: (storyId) => {
            const { downloads, downloadingIds, error } = get();
            if (downloads[storyId]) return 'downloaded';
            if (downloadingIds.has(storyId)) return 'downloading';
            if (error) return 'error';
            return 'idle';
        },

        getTotalDownloadSize: () => {
            const { downloads } = get();
            return Object.values(downloads).reduce((sum, d) => sum + d.sizeBytes, 0);
        },

        clearAllDownloads: async () => {
            try {
                const { downloads } = get();

                // Remove all content
                await Promise.all(
                    Object.keys(downloads).map((id) =>
                        AsyncStorage.removeItem(`${DOWNLOAD_CONTENT_PREFIX}${id}`)
                    )
                );

                // Clear list
                await AsyncStorage.removeItem(DOWNLOADS_KEY);

                set({ downloads: {} });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to clear downloads';
                set({ error: message });
            }
        },
    },
}));

// Helper to format bytes
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
