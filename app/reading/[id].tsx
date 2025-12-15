import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Modal, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ProgressBar, PortableTextRenderer } from '@/components';
import { useStory } from '@/hooks/useQueries';
import { useProgressStore } from '@/store/progressStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useThemeStore } from '@/store/themeStore';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';

type ReadingTheme = 'light' | 'dark' | 'sepia';

const readingThemes = {
    light: { bg: '#FFFFFF', text: '#1B0E0E' },
    dark: { bg: '#121212', text: '#FAFAFA' },
    sepia: { bg: '#F4ECD8', text: '#5C4B37' },
};

export default function ReadingScreen() {
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();
    const [progress, setProgress] = useState(0);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light');
    const hasShownCompletion = useRef(false);

    // Reading preferences
    const { fontSize, lineHeight, actions: prefsActions } = useReadingPrefsStore();

    // Progress & Library store
    const { progressMap, actions: progressActions } = useProgressStore();
    const { actions: libraryActions } = useLibraryStore();
    const { actions: themeActions } = useThemeStore();
    const saveTimeoutRef = useRef<number | null>(null);

    const isInLibrary = id ? libraryActions.isInLibrary(id) : false;

    const { data: storyDoc, isLoading } = useStory(id || '');

    // Load reading prefs on mount
    useEffect(() => {
        prefsActions.loadPrefs();
    }, [prefsActions]);

    // Load initial progress
    useEffect(() => {
        if (id && progressMap[id]) {
            setProgress(progressMap[id].percentage);
        }
    }, [id, progressMap]);

    // Debounced save progress
    const saveProgress = useCallback((newProgress: number) => {
        if (!id) return;

        // Clear existing timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce: save after 1 second of no scroll
        saveTimeoutRef.current = setTimeout(() => {
            progressActions.updateProgress(id, 0, newProgress);
        }, 1000) as unknown as number;
    }, [id, progressActions]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    const content = storyDoc?.content as PortableTextBlock[] | undefined;

    const handleScroll = useCallback((event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const scrollableHeight = contentSize.height - layoutMeasurement.height;
        if (scrollableHeight <= 0) return;

        const newProgress = Math.min(
            100,
            Math.round((contentOffset.y / scrollableHeight) * 100)
        );

        if (newProgress > 0 && newProgress !== progress) {
            setProgress(newProgress);
            saveProgress(newProgress);

            // Detect completion at 95%+
            if (newProgress >= 95 && !hasShownCompletion.current) {
                hasShownCompletion.current = true;
                setShowCompletionModal(true);
            }
        }
    }, [progress, saveProgress]);

    const handleMarkComplete = useCallback(async () => {
        if (id) {
            await progressActions.markComplete(id);
        }
        setShowCompletionModal(false);
        router.back();
    }, [id, progressActions, router]);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.center]}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    if (!storyDoc) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>Story not found</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.headerButton}
                    onPress={() => router.back()}
                >
                    <Ionicons
                        name="close"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle} numberOfLines={1}>
                        {storyDoc.title}
                    </Text>
                    <Text style={styles.headerSubtitle}>Chapter 1</Text>
                </View>
                <Pressable style={styles.headerButton}>
                    <Ionicons
                        name="ellipsis-vertical"
                        size={24}
                        color={theme.colors.text}
                    />
                </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <ProgressBar progress={progress} height={4} />
                <Text style={styles.progressText}>{progress}% complete</Text>
            </View>

            {/* Content */}
            <ScrollView
                style={[styles.content, { backgroundColor: readingThemes[readingTheme].bg }]}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contentContainer}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {content ? (
                    <PortableTextRenderer
                        content={content}
                        fontSize={fontSize}
                        lineHeight={lineHeight}
                        textColor={readingThemes[readingTheme].text}
                    />
                ) : (
                    <Text style={[styles.storyText, { fontSize, color: readingThemes[readingTheme].text }]}>
                        No content available.
                    </Text>
                )}
            </ScrollView>

            {/* Bottom Controls */}
            <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
                <View style={styles.controlRow}>
                    {/* Font Size */}
                    <View style={styles.fontControls}>
                        <Pressable
                            style={styles.controlButton}
                            onPress={() => {
                                haptics.light();
                                prefsActions.setFontSize(Math.max(14, fontSize - 2));
                            }}
                        >
                            <Text style={styles.fontButtonText}>A-</Text>
                        </Pressable>
                        <Text style={styles.fontSizeText}>{fontSize}pt</Text>
                        <Pressable
                            style={styles.controlButton}
                            onPress={() => {
                                haptics.light();
                                prefsActions.setFontSize(Math.min(28, fontSize + 2));
                            }}
                        >
                            <Text style={styles.fontButtonText}>A+</Text>
                        </Pressable>
                    </View>

                    {/* Theme Toggle */}
                    <Pressable
                        style={styles.controlButton}
                        onPress={() => {
                            haptics.selection();
                            const themes: ReadingTheme[] = ['light', 'dark', 'sepia'];
                            const currentIndex = themes.indexOf(readingTheme);
                            setReadingTheme(themes[(currentIndex + 1) % 3]);
                        }}
                    >
                        <Ionicons
                            name={readingTheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                            size={20}
                            color={theme.colors.text}
                        />
                    </Pressable>

                    {/* Bookmark */}
                    <Pressable
                        style={styles.controlButton}
                        onPress={async () => {
                            if (!storyDoc || !id) return;
                            haptics.success();
                            if (isInLibrary) {
                                await libraryActions.removeFromLibrary(id);
                            } else {
                                await libraryActions.addToLibrary({
                                    id: id,
                                    title: storyDoc.title || 'Untitled',
                                    coverImage: storyDoc.coverImage?.asset?.url || '',
                                    author: storyDoc.author?.name || 'Unknown',
                                    description: storyDoc.description || '',
                                    estimatedReadTime: storyDoc.estimatedReadTime || 5,
                                    level: storyDoc.level || 'Beginner',
                                } as any);
                            }
                        }}
                    >
                        <Ionicons
                            name={isInLibrary ? 'bookmark' : 'bookmark-outline'}
                            size={20}
                            color={isInLibrary ? theme.colors.primary : theme.colors.text}
                        />
                    </Pressable>

                    {/* Share */}
                    <Pressable
                        style={styles.controlButton}
                        onPress={async () => {
                            haptics.light();
                            try {
                                await Share.share({
                                    message: `Check out "${storyDoc?.title}" on English Tales!`,
                                });
                            } catch (e) { }
                        }}
                    >
                        <Ionicons name="share-outline" size={20} color={theme.colors.text} />
                    </Pressable>
                </View>
            </View>

            {/* Completion Modal */}
            <Modal
                visible={showCompletionModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowCompletionModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalIcon}>
                            <Ionicons name="trophy" size={48} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.modalTitle}>Congratulations! 🎉</Text>
                        <Text style={styles.modalMessage}>
                            You've finished reading this story!
                        </Text>
                        <Pressable style={styles.modalButton} onPress={handleMarkComplete}>
                            <Text style={styles.modalButtonText}>Mark as Complete</Text>
                        </Pressable>
                        <Pressable
                            style={styles.modalSecondary}
                            onPress={() => setShowCompletionModal(false)}
                        >
                            <Text style={styles.modalSecondaryText}>Continue Reading</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    headerButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
        gap: 2,
    },
    headerTitle: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.semibold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    progressContainer: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.xs,
    },
    progressText: {
        fontSize: theme.typography.size.xs,
        color: theme.colors.textMuted,
        textAlign: 'right',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.lg,
        paddingBottom: theme.spacing.xxxxl,
    },
    storyText: {
        color: theme.colors.text,
        lineHeight: 32,
        letterSpacing: 0.3,
    },
    controls: {
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fontControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
    },
    controlButton: {
        width: 40,
        height: 40,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.backgroundSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fontButtonText: {
        fontSize: theme.typography.size.md,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
    },
    fontSizeText: {
        fontSize: theme.typography.size.sm,
        color: theme.colors.textSecondary,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    modalContent: {
        width: '100%',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.xxl,
        padding: 32,
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    modalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.primary}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: theme.typography.size.xxl,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.text,
        marginBottom: 8,
    },
    modalMessage: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    modalButton: {
        width: '100%',
        backgroundColor: theme.colors.primary,
        paddingVertical: 16,
        borderRadius: theme.radius.full,
        alignItems: 'center',
        marginBottom: 12,
    },
    modalButtonText: {
        fontSize: theme.typography.size.lg,
        fontWeight: theme.typography.weight.bold,
        color: theme.colors.textInverse,
    },
    modalSecondary: {
        padding: 12,
    },
    modalSecondaryText: {
        fontSize: theme.typography.size.md,
        color: theme.colors.textSecondary,
    },
}));
