import React, { useRef, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, useWindowDimensions, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import { PortableTextBlock } from '@portabletext/types';
import PagerView from 'react-native-pager-view';
import { PortableTextRenderer } from './PortableTextRenderer';
import { haptics } from '@/utils/haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Highlight } from '@/store/highlightStore';

interface PagedContentProps {
    pages: PortableTextBlock[][];
    currentPage: number;
    onPageChange: (page: number) => void;
    onWordPress: (word: string) => void;
    onWordLongPress?: (word: string, blockKey: string) => void;
    onTryNextOnLastPage?: () => void;
    fontSize: number;
    lineHeight: number;
    fontFamily?: 'sans-serif' | 'serif';
    textColor: string;
    backgroundColor: string;
    dyslexicFontEnabled?: boolean;
    selectedWord?: string;
    highlights?: Highlight[];
}

export const PagedContent = React.memo(({
    pages,
    currentPage,
    onPageChange,
    onWordPress,
    onWordLongPress,
    onTryNextOnLastPage,
    fontSize,
    lineHeight,
    fontFamily,
    textColor,
    backgroundColor,
    dyslexicFontEnabled,
    selectedWord,
    highlights = [],
}: PagedContentProps) => {
    const { theme } = useTheme();
    const styles = createStyles(theme);
    const { width } = useWindowDimensions();
    const pagerRef = useRef<PagerView>(null);
    const lastSyncedPage = useRef(0);

    // Tap zone widths (20% each side for navigation)
    const tapZoneWidth = width * 0.20;

    // Sync PagerView when currentPage changes externally (e.g., restored from saved progress)
    useEffect(() => {
        if (currentPage !== lastSyncedPage.current && pagerRef.current) {
            pagerRef.current.setPageWithoutAnimation(currentPage);
            lastSyncedPage.current = currentPage;
        }
    }, [currentPage]);

    const handleLeftTap = useCallback(() => {
        if (currentPage > 0) {
            haptics.light();
            const newPage = currentPage - 1;
            pagerRef.current?.setPage(newPage);
            onPageChange(newPage);
        }
    }, [currentPage, onPageChange]);

    const handleRightTap = useCallback(() => {
        if (currentPage < pages.length - 1) {
            haptics.light();
            const newPage = currentPage + 1;
            pagerRef.current?.setPage(newPage);
            onPageChange(newPage);
        } else if (currentPage === pages.length - 1 && onTryNextOnLastPage) {
            // User tried to go past the last page - trigger completion
            onTryNextOnLastPage();
        }
    }, [currentPage, pages.length, onPageChange, onTryNextOnLastPage]);

    const handlePageSelected = useCallback((e: any) => {
        const newPage = e.nativeEvent.position;
        if (newPage !== currentPage) {
            onPageChange(newPage);
            lastSyncedPage.current = newPage;
        }
    }, [currentPage, onPageChange]);

    if (pages.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            {/* Pager View for swipe navigation */}
            <PagerView
                ref={pagerRef}
                style={styles.pager}
                initialPage={currentPage}
                onPageSelected={handlePageSelected}
                overdrag={false}
            >
                {pages.map((pageBlocks, pageIndex) => (
                    <View key={pageIndex} style={styles.page}>
                        <Animated.ScrollView
                            entering={FadeIn.duration(200)}
                            style={[
                                styles.pageContent,
                                {
                                    backgroundColor,
                                }
                            ]}
                            contentContainerStyle={{
                                flexGrow: 1,
                                paddingHorizontal: theme.spacing.xl,
                                paddingVertical: theme.spacing.xxl,
                                paddingBottom: theme.spacing.xxxxl, // Extra padding at bottom
                            }}
                            showsVerticalScrollIndicator={false}
                        >
                            <PortableTextRenderer
                                content={pageBlocks}
                                fontSize={fontSize}
                                lineHeight={lineHeight}
                                fontFamily={fontFamily}
                                textColor={textColor}
                                onWordPress={onWordPress}
                                onWordLongPress={onWordLongPress}
                                dyslexicFontEnabled={dyslexicFontEnabled}
                                selectedWord={selectedWord}
                                highlights={highlights}
                                enableDropCap={true}
                                isFirstPage={pageIndex === 0}
                            />
                        </Animated.ScrollView>
                    </View>
                ))}
            </PagerView>

            {/* Left tap zone for previous page */}
            <TouchableOpacity
                style={[styles.tapZone, styles.leftTapZone, { width: tapZoneWidth }]}
                onPress={handleLeftTap}
                activeOpacity={1}
            />

            {/* Right tap zone for next page */}
            <TouchableOpacity
                style={[styles.tapZone, styles.rightTapZone, { width: tapZoneWidth }]}
                onPress={handleRightTap}
                activeOpacity={1}
            />
        </View>
    );
});

PagedContent.displayName = 'PagedContent';

const createStyles = (theme: Theme) => StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    pager: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    pageContent: {
        flex: 1,
    },
    tapZone: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        zIndex: 10,
        // Transparent but touchable
        backgroundColor: 'transparent',
    },
    leftTapZone: {
        left: 0,
    },
    rightTapZone: {
        right: 0,
    },
});
