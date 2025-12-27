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
    TranslationLimitModal,
    PaywallModal,
    READING_THEMES,
    type ReadingTheme,
} from '@/components';
import { type QuizQuestion } from '@/types/sanity';
import { useStory } from '@/hooks/useQueries';
import { usePageCalculation } from '@/hooks/usePageCalculation';
import { useProgressStore } from '@/store/progressStore';
import { useAuthStore } from '@/store/authStore';
import { useDownloadStore } from '@/store/downloadStore';
import { useHighlightStore } from '@/store/highlightStore';
import { useReadingPrefsStore } from '@/store/readingPrefsStore';
import { PortableTextBlock } from '@portabletext/types';
import { analyticsService } from '@/services/firebase/analytics';
import { useTranslation } from 'react-i18next';

import {
    useReadingProgressManager,
    useDictionaryManagement,
    useHighlightManagement,
    useAudioAssist,
    useReadingCompletion,
    useReadingControls,
} from '@/hooks';


export default function ReadingScreen() {
    const { t } = useTranslation();
    const { theme } = useUnistyles();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { id } = useLocalSearchParams<{ id: string }>();

    // Paywall
    const [showPaywallModal, setShowPaywallModal] = useState(false);

    // Progress map for initial percentage
    const { progressMap } = useProgressStore();
    const { actions: downloadActions } = useDownloadStore();
    const { actions: prefsActions } = useReadingPrefsStore();
    const { user } = useAuthStore();

    // Get highlights for this story (reactive)
    const storyHighlights = useHighlightStore((state) => {
        if (!user || !id) return [];
        return state.highlights[user.id]?.[id] || [];
    });

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

    // Sync reading time on unmount - now handled by useReadingCompletion
    // (removed startTimeRef and manual tracking)

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
        showTranslationLimitModal,
        closeTranslationLimitModal,
        handleTranslationRewardEarned,
        remainingTranslations,
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

    // Completion, Review & Quiz Management
    const {
        showCompletionModal,
        showQuizModal,
        completionRating,
        reviewSheetRef,
        readingTimeMinutes,
        triggerCompletion,
        handleMarkComplete,
        handleContinueHome,
        handleReviewSubmit,
        handleQuizClose,
        syncReadingTime,
    } = useReadingCompletion({
        storyId: id,
        storyTitle: storyDoc?.title,
        wordCount: storyDoc?.wordCount,
        hasQuiz: !!(storyDoc?.quiz && storyDoc.quiz.length > 0),
        quizLength: storyDoc?.quiz?.length || 0,
    });

    // Sync reading time on unmount
    useEffect(() => {
        return () => syncReadingTime();
    }, [syncReadingTime]);

    // Kindle-style: show completion when user tries to go past last page
    const handleTryNextOnLastPage = useCallback(() => {
        triggerCompletion();
    }, [triggerCompletion]);

    // handleMarkComplete, handleQuizClose, handleReviewSubmit are now provided by useReadingCompletion hook

    // Reading Controls (font, theme, bookmark, settings)
    const {
        fontSize,
        lineHeight,
        fontFamily,
        readingTheme,
        dyslexicFontEnabled,
        isDark,
        highContrastEnabled: globalHighContrast,
        isInLibrary,
        showSettingsModal,
        handleFontDecrease,
        handleFontIncrease,
        cycleReadingTheme,
        handleThemeChange,
        handleBookmarkToggle,
        openSettings,
        closeSettings,
        setFontSize,
        setLineHeight,
        setFontFamily,
    } = useReadingControls({
        storyId: id,
        storyMeta: storyDoc ? {
            id,
            title: storyDoc.title,
            coverImage: storyDoc.coverImage?.asset?.url,
            author: storyDoc.author?.name,
            description: storyDoc.description,
            estimatedReadTime: storyDoc.estimatedReadTime,
            level: storyDoc.level,
        } : null,
    });

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
                    onSettings={openSettings}
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
                readingTimeMinutes={readingTimeMinutes}
                wordCount={storyDoc.wordCount || 0}
                onComplete={handleMarkComplete}
                onContinue={handleContinueHome}
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
                onSubmit={handleReviewSubmit}
            />

            <ReadingSettingsModal
                visible={showSettingsModal}
                fontSize={fontSize}
                lineHeight={lineHeight}
                fontFamily={fontFamily}
                readingTheme={readingTheme}
                onClose={closeSettings}
                onFontSizeChange={setFontSize}
                onLineHeightChange={setLineHeight}
                onFontFamilyChange={setFontFamily}
                onThemeChange={handleThemeChange}
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

            <TranslationLimitModal
                visible={showTranslationLimitModal}
                onClose={closeTranslationLimitModal}
                onRewardEarned={handleTranslationRewardEarned}
                onGetPremium={() => {
                    closeTranslationLimitModal();
                    setShowPaywallModal(true);
                }}
            />

            <PaywallModal
                visible={showPaywallModal}
                onClose={() => setShowPaywallModal(false)}
                onSuccess={() => setShowPaywallModal(false)}
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
