import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ReadingHeader,
    ReadingProgressBar,
    ReadingControls,
    CompletionModal,
    ReadingSettingsModal,
    WordLookupSheet,
    QuizModal,
    AudioPlayer,
    PortableTextRenderer,
    ReadingScreenSkeleton,
    WriteReviewSheet,
    READING_THEMES,
    type ReadingTheme,
} from '@/components';
import { type QuizQuestion } from '@/types/sanity';
import { useStory } from '@/hooks/useQueries';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useThemeStore } from '@/store/themeStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useDownloadStore } from '@/store/downloadStore';
import { dictionaryService, DictionaryEntry } from '@/services/dictionary';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import BottomSheet from '@gorhom/bottom-sheet';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';
import * as Speech from 'expo-speech';

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
    const { isDark, highContrastEnabled: globalHighContrast } = useThemeStore();
    const hasShownCompletion = useRef(false);
    const saveTimeoutRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(Date.now());

    // Word Lookup
    const wordSheetRef = useRef<BottomSheetModal>(null);
    const [selectedWord, setSelectedWord] = useState('');
    const [dictionaryData, setDictionaryData] = useState<DictionaryEntry | null>(null);
    const [isWordLoading, setIsWordLoading] = useState(false);

    // Review
    const reviewSheetRef = useRef<BottomSheet>(null);
    const [completionRating, setCompletionRating] = useState(0);

    // Audio Assist (TTS)
    const [showAudioPlayer, setShowAudioPlayer] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isAudioBuffering, setIsAudioBuffering] = useState(false);

    // Quiz
    const [showQuizModal, setShowQuizModal] = useState(false);

    // Stores
    const { fontSize, lineHeight, dyslexicFontEnabled, actions: prefsActions } = useReadingPrefsStore();
    const { progressMap, totalReadingTimeMs, actions: progressActions } = useProgressStore();
    const { actions: libraryActions } = useLibraryStore();
    const { downloads, actions: downloadActions } = useDownloadStore();

    const isInLibrary = id ? libraryActions.isInLibrary(id) : false;
    const isDownloaded = id ? downloadActions.isDownloaded(id) : false;

    const { data: storyDoc, isLoading: loadingStory } = useStory(id || '');
    const [downloadedContent, setDownloadedContent] = useState<PortableTextBlock[] | null>(null);

    // Load offline content if available
    useEffect(() => {
        if (id && isDownloaded) {
            downloadActions.fetchDownloadedContent(id).then(setDownloadedContent);
        }
    }, [id, isDownloaded, downloadActions]);

    const isLoading = loadingStory && !downloadedContent; // Don't show skeleton if we have offline content

    // Sync reading time on unmount
    useEffect(() => {
        startTimeRef.current = Date.now();
        return () => {
            const elapsed = Date.now() - startTimeRef.current;
            if (id && elapsed > 2000) { // Min 2 seconds to count
                progressActions.incrementReadingTime(id, elapsed);
            }
        };
    }, [id, progressActions]);

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
        if (!id || !storyDoc) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            progressActions.updateProgress(id, 0, newProgress, storyDoc.title);
        }, 1000) as unknown as number;
    }, [id, progressActions, storyDoc]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    // Use cached content if downloaded
    const content = useMemo(() => {
        if (downloadedContent) return downloadedContent;
        return storyDoc?.content as PortableTextBlock[] | undefined;
    }, [downloadedContent, storyDoc]);

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

    const handleMarkComplete = useCallback(async (rating?: number) => {
        haptics.success();
        const readingTimeMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
        const metadata = {
            rating,
            readingTime: readingTimeMinutes,
            wordCount: storyDoc?.wordCount || 0
        };

        if (id) await progressActions.markComplete(id, storyDoc?.title, metadata);
        setShowCompletionModal(false);

        if (rating) {
            setCompletionRating(rating);
            // Small delay to ensure completion modal is closed
            setTimeout(() => {
                reviewSheetRef.current?.expand();
            }, 500);
        } else {
            // Check if there's a quiz
            if (storyDoc?.quiz && storyDoc.quiz.length > 0) {
                setShowQuizModal(true);
            } else {
                router.back();
            }
        }
    }, [id, progressActions, router, storyDoc]);

    const handleQuizClose = useCallback(async (accuracy: number) => {
        if (id && storyDoc?.quiz) {
            const score = Math.round((accuracy / 100) * storyDoc.quiz.length);
            await progressActions.saveQuizResult(id, score, storyDoc.quiz.length);
        }
        setShowQuizModal(false);
        router.back();
    }, [id, storyDoc, progressActions, router]);

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

    // Sync readingTheme state with global theme on mount
    useEffect(() => {
        const currentMode = useThemeStore.getState().mode;
        if (currentMode === 'sepia') setReadingTheme('sepia');
        else if (currentMode === 'dark') setReadingTheme('dark');
        else setReadingTheme('light');
    }, []);

    const cycleReadingTheme = useCallback(() => {
        haptics.selection();
        const themes: ReadingTheme[] = ['light', 'dark', 'sepia'];
        const currentIndex = themes.indexOf(readingTheme);
        const next = themes[(currentIndex + 1) % 3];
        setReadingTheme(next);

        // Sync with global theme store for a unified feel
        useThemeStore.getState().actions.setMode(next);
    }, [readingTheme]);

    const handleWordPress = useCallback(async (word: string) => {
        const cleaned = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim();
        if (!cleaned) return;

        haptics.light(); // Use light for subtle feel
        setSelectedWord(cleaned);
        setIsWordLoading(true);
        wordSheetRef.current?.present();

        const data = await dictionaryService.lookup(cleaned);
        setDictionaryData(data);
        setIsWordLoading(false);
    }, []);

    // TTS Logic
    const storyText = useMemo(() => {
        if (!content) return '';
        return content
            .map(block => {
                if (block._type !== 'block' || !block.children) return '';
                return (block.children as any[]).map(c => c.text).join('');
            })
            .join(' ');
    }, [content]);

    const handlePlayPauseAudio = useCallback(async () => {
        haptics.selection();
        if (isAudioPlaying) {
            Speech.pause();
            setIsAudioPlaying(false);
        } else {
            const isPaused = await Speech.isSpeakingAsync();
            if (isPaused) {
                Speech.resume();
                setIsAudioPlaying(true);
            } else {
                setIsAudioBuffering(true);
                Speech.speak(storyText, {
                    language: 'en',
                    onStart: () => {
                        setIsAudioPlaying(true);
                        setIsAudioBuffering(false);
                    },
                    onDone: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                    onStopped: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                    onError: () => {
                        setIsAudioPlaying(false);
                        setIsAudioBuffering(false);
                    },
                });
            }
        }
    }, [isAudioPlaying, storyText]);

    const handleStopAudio = useCallback(() => {
        haptics.selection();
        Speech.stop();
        setIsAudioPlaying(false);
        setIsAudioBuffering(false);
    }, []);

    const toggleAudioPlayer = useCallback(() => {
        haptics.light();
        setShowAudioPlayer(prev => {
            if (prev) {
                Speech.stop();
                setIsAudioPlaying(false);
            }
            return !prev;
        });
    }, []);

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

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

    const currentTheme = READING_THEMES[readingTheme];

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: currentTheme.bg }]}>
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
                style={[
                    styles.content,
                    {
                        backgroundColor: globalHighContrast
                            ? (isDark ? '#000000' : '#FFFFFF')
                            : currentTheme.bg
                    }
                ]}
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
                        textColor={globalHighContrast
                            ? (isDark ? '#FFFFFF' : '#000000')
                            : currentTheme.text
                        }
                        onWordPress={handleWordPress}
                        dyslexicFontEnabled={dyslexicFontEnabled}
                    />
                ) : (
                    <Text style={[styles.storyText, { fontSize, color: currentTheme.text }]}>
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
                    onAudioToggle={toggleAudioPlayer}
                />
            </View>

            {showAudioPlayer && (
                <AudioPlayer
                    isPlaying={isAudioPlaying}
                    isBuffering={isAudioBuffering}
                    onPlayPause={handlePlayPauseAudio}
                    onStop={handleStopAudio}
                />
            )}

            <CompletionModal
                visible={showCompletionModal}
                storyTitle={storyDoc.title}
                readingTimeMinutes={Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000))}
                wordCount={storyDoc.wordCount || 0}
                onComplete={handleMarkComplete}
                onContinue={() => {
                    setShowCompletionModal(false);
                    router.back();
                }}
            />

            <QuizModal
                visible={showQuizModal}
                questions={storyDoc?.quiz as QuizQuestion[]}
                onClose={handleQuizClose}
            />

            <WriteReviewSheet
                ref={reviewSheetRef}
                storyTitle={storyDoc.title}
                initialRating={completionRating}
                onClose={() => reviewSheetRef.current?.close()}
                onSubmit={async (rating, text) => {
                    const { user } = useAuthStore.getState();
                    if (!user || !id) return;

                    const { reviewService } = await import('@/services/reviewService');
                    await reviewService.addReview(
                        id,
                        storyDoc.title,
                        user.id,
                        user.displayName || 'Anonymous',
                        user.photoURL,
                        rating,
                        text
                    );

                    // After review, maybe go back or show quiz
                    if (storyDoc?.quiz && storyDoc.quiz.length > 0) {
                        setShowQuizModal(true);
                    } else {
                        router.back();
                    }
                }}
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

            <WordLookupSheet
                ref={wordSheetRef}
                word={selectedWord}
                dictionaryData={dictionaryData}
                isLoading={isWordLoading}
                storyId={id}
                storyTitle={storyDoc.title}
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
        paddingVertical: 24,
        paddingBottom: 140,
    },
    storyText: {
        color: theme.colors.text,
        lineHeight: 34,
        letterSpacing: 0.2,
    },
    controls: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        borderTopWidth: 1,
        borderTopColor: theme.colors.borderLight,
        ...theme.shadows.lg,
    },
}));
