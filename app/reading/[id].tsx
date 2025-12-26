import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
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
    PagedContent,
    ReadingScreenSkeleton,
    WriteReviewSheet,
    HighlightMenu,
    READING_THEMES,
    type ReadingTheme,
} from '@/components';
import { type QuizQuestion } from '@/types/sanity';
import { useStory } from '@/hooks/useQueries';
import { usePageCalculation } from '@/hooks/usePageCalculation';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { useThemeStore } from '@/store/themeStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useHighlightStore } from '@/store/highlightStore';
import { haptics } from '@/utils/haptics';
import { PortableTextBlock } from '@portabletext/types';
import { analyticsService } from '@/services/firebase/analytics';
import { useTranslation } from 'react-i18next';
import { useToastStore } from '@/store/toastStore';
import BottomSheet from '@gorhom/bottom-sheet';

import {
    useReadingProgressManager,
    useDictionaryManagement,
    useHighlightManagement,
    useAudioAssist,
} from '@/hooks';


export default function ReadingScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const { isDark, highContrastEnabled: globalHighContrast } = useThemeStore();
    const hasShownCompletion = useRef(false);
    const startTimeRef = useRef<number>(Date.now());

    // Review
    const reviewSheetRef = useRef<BottomSheet>(null);
    const [completionRating, setCompletionRating] = useState(0);

    // Quiz
    const [showQuizModal, setShowQuizModal] = useState(false);

    // Stores
    const { fontSize, lineHeight, dyslexicFontEnabled, theme: readingTheme, fontFamily, actions: prefsActions } = useReadingPrefsStore();
    const { progressMap, actions: progressActions } = useProgressStore();
    const { actions: libraryActions } = useLibraryStore();
    const isInLibrary = useLibraryStore((state) => state.items.some((i) => i.storyId === id));
    const { downloads, actions: downloadActions } = useDownloadStore();
    const { user } = useAuthStore();
    const toastActions = useToastStore((state) => state.actions);

    // Get highlights for this story (reactive)
    const storyHighlights = useHighlightStore((state) => {
        if (!user || !id) return [];
        return state.highlights[user.id]?.[id] || [];
    });

    // Memoized font size handlers to prevent re-renders
    const handleFontDecrease = useCallback(() => {
        haptics.light();
        prefsActions.setFontSize(Math.max(14, fontSize - 2));
    }, [fontSize, prefsActions]);

    const handleFontIncrease = useCallback(() => {
        haptics.light();
        prefsActions.setFontSize(Math.min(28, fontSize + 2));
    }, [fontSize, prefsActions]);

    const isDownloaded = id ? downloadActions.isDownloaded(id) : false;

    const { data: storyDoc, isLoading: loadingStory } = useStory(id || '');
    const [downloadedContent, setDownloadedContent] = useState<PortableTextBlock[] | null>(null);

    // Load offline content if available
    useEffect(() => {
        if (id && isDownloaded) {
            downloadActions.fetchDownloadedContent(id).then(setDownloadedContent);
        }
    }, [id, isDownloaded, downloadActions]);

    const isLoading = loadingStory && !downloadedContent;

    useEffect(() => {
        analyticsService.logScreenView('ReadingScreen');
        if (id) {
            analyticsService.logEvent('story_opened', { story_id: id });
        }
    }, [id]);

    useEffect(() => {
        if (!isLoading && storyDoc) {
            analyticsService.logEvent('story_content_loaded', {
                story_id: id,
                story_title: storyDoc.title
            });
        }
    }, [isLoading, storyDoc, id]);

    // Sync reading time on unmount
    useEffect(() => {
        startTimeRef.current = Date.now();
        return () => {
            const elapsed = Date.now() - startTimeRef.current;
            if (id && elapsed > 2000) {
                progressActions.incrementReadingTime(id, elapsed);
            }
        };
    }, [id, progressActions]);

    // Load reading prefs on mount
    useEffect(() => {
        prefsActions.loadPrefs();
    }, [prefsActions]);

    // Use cached content if downloaded
    const content = useMemo(() => {
        if (downloadedContent) return downloadedContent;
        return storyDoc?.content as PortableTextBlock[] | undefined;
    }, [downloadedContent, storyDoc]);

    // Calculate pages from content
    const { pages, totalPages, findPageByBlockKey } = usePageCalculation({
        content,
        fontSize,
        lineHeight,
        headerHeight: 100,
        controlsHeight: 80,
    });

    // --- Modularized Logic Hooks ---

    // Progress Management
    const {
        progress,
        currentPage,
        handlePageChange
    } = useReadingProgressManager({
        storyId: id,
        storyTitle: storyDoc?.title,
        totalPages,
        pages,
        findPageByBlockKey,
        initialPercentage: id && progressMap[id] ? progressMap[id].percentage : 0,
    });

    // Dictionary Management
    const {
        wordSheetRef,
        selectedWord,
        dictionaryData,
        isWordLoading,
        handleWordPress,
    } = useDictionaryManagement({ storyId: id });

    // Highlight Management
    const {
        showHighlightMenu,
        setShowHighlightMenu,
        highlightWord,
        handleWordLongPress,
        addHighlight,
    } = useHighlightManagement({ storyId: id, currentPage });

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

    const {
        showAudioPlayer,
        isAudioPlaying,
        isAudioBuffering,
        handlePlayPauseAudio,
        handleStopAudio,
        toggleAudioPlayer,
    } = useAudioAssist({ storyText });

    // --- End Modularized Logic Hooks ---

    // Kindle-style: show completion when user tries to go past last page
    const handleTryNextOnLastPage = useCallback(() => {
        if (!hasShownCompletion.current) {
            hasShownCompletion.current = true;
            haptics.success();
            setShowCompletionModal(true);
        }
    }, []);

    const handleMarkComplete = useCallback(async (rating?: number) => {
        haptics.success();
        const readingTimeMinutes = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 60000));
        const metadata = {
            rating,
            readingTime: readingTimeMinutes,
            wordCount: storyDoc?.wordCount || 0
        };

        if (id) {
            analyticsService.logEvent('story_completed', {
                story_id: id,
                story_title: storyDoc?.title,
                rating,
                reading_time: readingTimeMinutes,
                word_count: storyDoc?.wordCount || 0
            });
            await progressActions.markComplete(id, storyDoc?.title, metadata);
        }
        setShowCompletionModal(false);

        if (rating) {
            setCompletionRating(rating);
            setTimeout(() => {
                reviewSheetRef.current?.expand();
            }, 500);
        } else {
            setShowCompletionModal(false);
            router.push('/(tabs)/discover');
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

        if (!user || user.isAnonymous) {
            toastActions.warning(t('auth.guestBanner.title'));
            return;
        }

        if (isInLibrary) {
            const result = await libraryActions.removeFromLibrary(id);
            if (result.success) {
                toastActions.info(t('library.menu.removeFromLibrary'));
            }
        } else {
            const result = await libraryActions.addToLibrary({
                id,
                title: storyDoc.title || 'Untitled',
                coverImage: storyDoc.coverImage?.asset?.url || '',
                author: storyDoc.author?.name || 'Unknown',
                description: storyDoc.description || '',
                estimatedReadTime: storyDoc.estimatedReadTime || 5,
                level: storyDoc.level || 'Beginner',
            } as any);

            if (result.success) {
                toastActions.success(t('profile.tabSaved'));
            }
        }
    }, [id, storyDoc, isInLibrary, libraryActions, user, toastActions, t]);

    const cycleReadingTheme = useCallback(() => {
        haptics.selection();
        const themes: ReadingTheme[] = ['light', 'dark', 'sepia'];
        const currentIndex = themes.indexOf(readingTheme);
        const next = themes[(currentIndex + 1) % 3];
        prefsActions.setTheme(next);
        useThemeStore.getState().actions.setMode(next);
    }, [readingTheme, prefsActions]);

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
                <Pressable onPress={() => router.back()} style={{ marginTop: theme.spacing.xl }}>
                    <Text style={{ color: theme.colors.primary }}>{t('common.goBack')}</Text>
                </Pressable>
            </View>
        );
    }

    const currentTheme = READING_THEMES[readingTheme];

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: currentTheme.bg }]}>
            <View style={{ zIndex: 100 }}>
                <ReadingHeader
                    title={storyDoc.title}
                    isDownloaded={isDownloaded}
                    onClose={() => router.back()}
                    onSettings={() => setShowSettingsModal(true)}
                />

                <ReadingProgressBar
                    progress={progress}
                    estimatedReadTime={storyDoc.estimatedReadTime || 5}
                    currentPage={currentPage}
                    totalPages={totalPages}
                />
            </View>

            {pages.length > 0 ? (
                <PagedContent
                    pages={pages}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    onWordPress={handleWordPress}
                    onWordLongPress={handleWordLongPress}
                    fontSize={fontSize}
                    lineHeight={lineHeight}
                    fontFamily={fontFamily}
                    textColor={globalHighContrast
                        ? (isDark ? '#FFFFFF' : '#000000')
                        : currentTheme.text
                    }
                    backgroundColor={globalHighContrast
                        ? (isDark ? '#000000' : '#FFFFFF')
                        : currentTheme.bg
                    }
                    dyslexicFontEnabled={dyslexicFontEnabled}
                    selectedWord={selectedWord}
                    onTryNextOnLastPage={handleTryNextOnLastPage}
                    highlights={storyHighlights}
                />
            ) : (
                <View style={styles.emptyContent}>
                    <Text style={[styles.storyText, { fontSize, color: currentTheme.text }]}>
                        {t('reading.noContent')}
                    </Text>
                </View>
            )}

            <View
                style={{
                    paddingBottom: insets.bottom + theme.spacing.sm,
                    backgroundColor: currentTheme.bg,
                }}
            >
                <ReadingControls
                    fontSize={fontSize}
                    readingTheme={readingTheme}
                    isInLibrary={isInLibrary}
                    storyTitle={storyDoc.title}
                    onFontDecrease={handleFontDecrease}
                    onFontIncrease={handleFontIncrease}
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
                    router.replace('/(tabs)');
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
                fontFamily={fontFamily}
                readingTheme={readingTheme}
                onClose={() => setShowSettingsModal(false)}
                onFontSizeChange={prefsActions.setFontSize}
                onLineHeightChange={prefsActions.setLineHeight}
                onFontFamilyChange={prefsActions.setFontFamily}
                onThemeChange={(t) => {
                    prefsActions.setTheme(t);
                    useThemeStore.getState().actions.setMode(t);
                }}
            />

            <WordLookupSheet
                ref={wordSheetRef}
                word={selectedWord}
                dictionaryData={dictionaryData}
                isLoading={isWordLoading}
                storyId={id}
                storyTitle={storyDoc.title}
            />

            <HighlightMenu
                visible={showHighlightMenu}
                selectedText={highlightWord}
                onHighlight={addHighlight}
                onCopy={() => {
                    setShowHighlightMenu(false);
                }}
                onDismiss={() => setShowHighlightMenu(false)}
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
        flexGrow: 1,
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.xxl,
        paddingBottom: theme.spacing.xxxxl * 3,
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
    emptyContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.xl,
    },
}));
