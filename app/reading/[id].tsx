import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PortableTextRenderer, ReadingScreenSkeleton } from '@/components';
import {
    ReadingHeader,
    ReadingProgressBar,
    ReadingControls,
    CompletionModal,
    ReadingSettingsModal,
    READING_THEMES,
    type ReadingTheme,
} from '@/components/reading';
import { useStory } from '@/hooks/useQueries';
import { useProgressStore } from '@/store/progressStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useDownloadStore } from '@/store/downloadStore';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';

import { useTranslation } from 'react-i18next';

export default function ReadingScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [progress, setProgress] = useState(0);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [readingTheme, setReadingTheme] = useState<ReadingTheme>('light');
    const hasShownCompletion = useRef(false);
    const saveTimeoutRef = useRef<number | null>(null);

    // Stores
    const { fontSize, lineHeight, actions: prefsActions } = useReadingPrefsStore();
    const { progressMap, actions: progressActions } = useProgressStore();
    const { actions: libraryActions } = useLibraryStore();
    const { downloads, actions: downloadActions } = useDownloadStore();

    const isInLibrary = id ? libraryActions.isInLibrary(id) : false;
    const isDownloaded = id ? downloadActions.isDownloaded(id) : false;

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
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            progressActions.updateProgress(id, 0, newProgress);
        }, 1000) as unknown as number;
    }, [id, progressActions]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Use cached content if downloaded
    const content = useMemo(() => {
        if (id && isDownloaded && downloads[id]?.content?.length > 0) {
            return downloads[id].content;
        }
        return storyDoc?.content as PortableTextBlock[] | undefined;
    }, [id, isDownloaded, downloads, storyDoc]);

    const handleScroll = useCallback((event: any) => {
        const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
        const scrollableHeight = contentSize.height - layoutMeasurement.height;
        if (scrollableHeight <= 0) return;

        const newProgress = Math.min(100, Math.round((contentOffset.y / scrollableHeight) * 100));

        if (newProgress > 0 && newProgress !== progress) {
            setProgress(newProgress);
            saveProgress(newProgress);

            if (newProgress >= 95 && !hasShownCompletion.current) {
                hasShownCompletion.current = true;
                setShowCompletionModal(true);
            }
        }
    }, [progress, saveProgress]);

    const handleMarkComplete = useCallback(async () => {
        if (id) await progressActions.markComplete(id);
        setShowCompletionModal(false);
        router.back();
    }, [id, progressActions, router]);

    const handleBookmarkToggle = useCallback(async () => {
        if (!storyDoc || !id) return;
        haptics.success();
        if (isInLibrary) {
            await libraryActions.removeFromLibrary(id);
        } else {
            await libraryActions.addToLibrary({
                id,
                title: storyDoc.title || 'Untitled',
                coverImage: storyDoc.coverImage?.asset?.url || '',
                author: storyDoc.author?.name || 'Unknown',
                description: storyDoc.description || '',
                estimatedReadTime: storyDoc.estimatedReadTime || 5,
                level: storyDoc.level || 'Beginner',
            } as any);
        }
    }, [id, storyDoc, isInLibrary, libraryActions]);

    const cycleReadingTheme = useCallback(() => {
        haptics.selection();
        const themes: ReadingTheme[] = ['light', 'dark', 'sepia'];
        const currentIndex = themes.indexOf(readingTheme);
        setReadingTheme(themes[(currentIndex + 1) % 3]);
    }, [readingTheme]);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ReadingScreenSkeleton />
            </View>
        );
    }

    if (!storyDoc) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>{t('reading.notFound')}</Text>
                <Pressable onPress={() => router.back()} style={{ marginTop: 20 }}>
                    <Text style={{ color: theme.colors.primary }}>{t('common.goBack')}</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ReadingHeader
                title={storyDoc.title}
                isDownloaded={isDownloaded}
                onClose={() => router.back()}
                onSettings={() => setShowSettingsModal(true)}
            />

            <ReadingProgressBar
                progress={progress}
                estimatedReadTime={storyDoc.estimatedReadTime || 5}
            />

            <ScrollView
                style={[styles.content, { backgroundColor: READING_THEMES[readingTheme].bg }]}
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
                        textColor={READING_THEMES[readingTheme].text}
                    />
                ) : (
                    <Text style={[styles.storyText, { fontSize, color: READING_THEMES[readingTheme].text }]}>
                        {t('reading.noContent')}
                    </Text>
                )}
            </ScrollView>

            <View style={[styles.controls, { paddingBottom: insets.bottom + 8 }]}>
                <ReadingControls
                    fontSize={fontSize}
                    readingTheme={readingTheme}
                    isInLibrary={isInLibrary}
                    storyTitle={storyDoc.title}
                    onFontDecrease={() => { haptics.light(); prefsActions.setFontSize(Math.max(14, fontSize - 2)); }}
                    onFontIncrease={() => { haptics.light(); prefsActions.setFontSize(Math.min(28, fontSize + 2)); }}
                    onThemeToggle={cycleReadingTheme}
                    onBookmarkToggle={handleBookmarkToggle}
                />
            </View>

            <CompletionModal
                visible={showCompletionModal}
                onComplete={handleMarkComplete}
                onContinue={() => setShowCompletionModal(false)}
            />

            <ReadingSettingsModal
                visible={showSettingsModal}
                fontSize={fontSize}
                lineHeight={lineHeight}
                readingTheme={readingTheme}
                onClose={() => setShowSettingsModal(false)}
                onFontSizeChange={prefsActions.setFontSize}
                onLineHeightChange={prefsActions.setLineHeight}
                onThemeChange={setReadingTheme}
            />
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: theme.typography.size.lg,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xxxl,
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
}));
