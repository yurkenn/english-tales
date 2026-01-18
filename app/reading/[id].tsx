import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
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
    useUnifiedStoryData,
    type StorySource,
} from '@/hooks';
import { useUserStoryProgress } from '@/hooks/useUserStoryProgress';
import { useUserStoryFavorite } from '@/hooks/useUserStoryFavorite';


export default function ReadingScreen() {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { containerPadding } = useResponsiveLayout();
    const { id, source } = useLocalSearchParams<{ id: string; source?: string }>();

    // Determine story source (sanity or community)
    const storySource: StorySource = source === 'community' ? 'community' : 'sanity';
    const isCommunityStory = storySource === 'community';

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

    const isDownloaded = !isCommunityStory && id ? downloadActions.isDownloaded(id) : false;

    // Use unified story data for community stories, original query for sanity stories
    const { story: unifiedStory, isLoading: loadingUnified } = useUnifiedStoryData(
        isCommunityStory ? id : undefined,
        'community'
    );
    const { data: storyDoc, isLoading: loadingStory } = useStory(!isCommunityStory ? id || '' : '');
    const [downloadedContent, setDownloadedContent] = useState<PortableTextBlock[] | null>(null);

    // Community story progress tracking
    const communityProgress = useUserStoryProgress(isCommunityStory ? id : undefined);
    const communityFavorite = useUserStoryFavorite(isCommunityStory ? id : undefined);

    // Load offline content if available (only for sanity stories)
    useEffect(() => {
        if (id && isDownloaded && !isCommunityStory) {
            downloadActions.fetchDownloadedContent(id).then(setDownloadedContent);
        }
    }, [id, isDownloaded, downloadActions, isCommunityStory]);

    const isLoading = isCommunityStory ? loadingUnified : (loadingStory && !downloadedContent);

    useEffect(() => {
        analyticsService.logScreenView('ReadingScreen');
        if (id) {
            analyticsService.logEvent('story_opened', { story_id: id });
        }
    }, [id]);

    useEffect(() => {
        const title = isCommunityStory ? unifiedStory?.title : storyDoc?.title;
        if (!isLoading && title) {
            analyticsService.logEvent('story_content_loaded', {
                story_id: id,
                story_title: title,
                source: storySource,
            });
        }
    }, [isLoading, storyDoc, unifiedStory, id, isCommunityStory, storySource]);

    // Sync reading time on unmount - now handled by useReadingCompletion
    // (removed startTimeRef and manual tracking)

    // Load reading prefs on mount
    useEffect(() => {
        prefsActions.loadPrefs();
    }, [prefsActions]);

    // Use cached content if downloaded, or unified story content for community stories
    const content = useMemo(() => {
        if (isCommunityStory && unifiedStory?.content) {
            return unifiedStory.content;
        }
        if (downloadedContent) return downloadedContent;
        return storyDoc?.content as PortableTextBlock[] | undefined;
    }, [isCommunityStory, unifiedStory, downloadedContent, storyDoc]);

    // Reading Controls - must come before usePageCalculation since it provides fontSize/lineHeight
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
        storyMeta: isCommunityStory
            ? (unifiedStory ? {
                id,
                title: unifiedStory.title,
                coverImage: unifiedStory.coverImage,
                author: unifiedStory.author,
                description: unifiedStory.description,
                estimatedReadTime: unifiedStory.estimatedReadTime,
                level: unifiedStory.difficulty,
            } : null)
            : (storyDoc ? {
                id,
                title: storyDoc.title,
                coverImage: storyDoc.coverImage?.asset?.url,
                author: storyDoc.author?.name,
                description: storyDoc.description,
                estimatedReadTime: storyDoc.estimatedReadTime,
                level: storyDoc.level,
            } : null),
    });

    // Calculate pages from content
    const { pages, totalPages, findPageByBlockKey } = usePageCalculation({
        content,
        fontSize,
        lineHeight,
        headerHeight: 60 + insets.top + (theme.spacing.xxl), // Header + top inset + padding
        controlsHeight: 80 + insets.bottom + (theme.spacing.xxl), // Controls + bottom inset + padding
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
        isWordSheetOpen,
        closeWordSheet,
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
        isReviewSheetOpen,
        readingTimeMinutes,
        triggerCompletion,
        handleMarkComplete,
        handleContinueHome,
        handleReviewSubmit,
        handleQuizClose,
        closeReviewSheet,
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

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ReadingScreenSkeleton />
            </View>
        );
    }

    // Determine if we have a valid story
    const hasStory = isCommunityStory ? !!unifiedStory : !!storyDoc;
    const effectiveTitle = isCommunityStory ? unifiedStory?.title : storyDoc?.title;
    const effectiveReadTime = isCommunityStory
        ? unifiedStory?.estimatedReadTime || 5
        : storyDoc?.estimatedReadTime || 5;
    const effectiveWordCount = isCommunityStory
        ? unifiedStory?.wordCount || 0
        : storyDoc?.wordCount || 0;

    if (!hasStory) {
        return (
            <View style={[styles.container, { paddingTop: insets.top }, styles.center]}>
                <Text style={styles.errorText}>{t('reading.notFound')}</Text>
                <TouchableOpacity onPress={() => router.back()} style={{ marginTop: theme.spacing.xl }} activeOpacity={0.7}>
                    <Text style={{ color: theme.colors.primary }}>{t('common.goBack')}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const currentTheme = READING_THEMES[readingTheme];

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: currentTheme.bg }]}>
            <View style={{ zIndex: 100 }}>
                <ReadingHeader
                    title={effectiveTitle || ''}
                    isDownloaded={isDownloaded}
                    onClose={() => router.back()}
                    onSettings={openSettings}
                />

                <ReadingProgressBar
                    progress={progress}
                    estimatedReadTime={effectiveReadTime}
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
                    zIndex: 20, // Ensure controls are above PagedContent
                    elevation: 5,
                }}
            >
                <ReadingControls
                    fontSize={fontSize}
                    readingTheme={readingTheme}
                    isInLibrary={isInLibrary}
                    storyTitle={effectiveTitle || ''}
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
                storyTitle={effectiveTitle || ''}
                readingTimeMinutes={readingTimeMinutes}
                wordCount={effectiveWordCount}
                onComplete={handleMarkComplete}
                onContinue={handleContinueHome}
            />

            {/* Quiz Modal - only for Sanity stories with quiz */}
            {!isCommunityStory && storyDoc?.quiz && storyDoc.quiz.length > 0 && (
                <QuizModal
                    visible={showQuizModal}
                    questions={storyDoc.quiz as QuizQuestion[]}
                    onClose={handleQuizClose}
                />
            )}

            {/* Write Review Sheet - conditional rendering to prevent touch blocking */}
            {isReviewSheetOpen && (
                <WriteReviewSheet
                    ref={reviewSheetRef}
                    storyTitle={effectiveTitle || ''}
                    initialRating={completionRating}
                    onClose={closeReviewSheet}
                    onSubmit={handleReviewSubmit}
                />
            )}

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

            {/* Word Lookup Sheet - conditional rendering to prevent touch blocking */}
            {isWordSheetOpen && (
                <WordLookupSheet
                    ref={wordSheetRef}
                    word={selectedWord}
                    dictionaryData={dictionaryData}
                    isLoading={isWordLoading}
                    storyId={id}
                    storyTitle={effectiveTitle}
                />
            )}

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

const createStyles = (theme: Theme) => StyleSheet.create({
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
});
