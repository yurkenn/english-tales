import { useMemo, useCallback } from 'react';
import { useWindowDimensions } from 'react-native';
import { PortableTextBlock } from '@portabletext/types';

interface UsePageCalculationProps {
    content: PortableTextBlock[] | undefined;
    fontSize: number;
    lineHeight: number;
    headerHeight?: number;
    controlsHeight?: number;
    horizontalPadding?: number;
    verticalPadding?: number;
}

interface UsePageCalculationResult {
    pages: PortableTextBlock[][];
    totalPages: number;
    findPageByBlockKey: (blockKey: string | undefined) => number;
}

// Get text content from a block
const getBlockText = (block: PortableTextBlock): string => {
    if (block._type !== 'block' || !block.children) return '';
    return (block.children as any[])
        .map((child) => child.text || '')
        .join('');
};

// Estimate how many lines a block will take
const estimateBlockLines = (
    block: PortableTextBlock,
    charsPerLine: number
): number => {
    if (block._type === 'image') return 10; // Images take significant space
    if (block._type === 'checkpoint') return 8; // Checkpoints need space

    const text = getBlockText(block);
    if (!text) return 0;

    // Add extra lines for headings
    const style = (block as any).style || 'normal';
    const headingMultiplier = style === 'h2' ? 2 : style === 'h3' ? 1.5 : 1;

    // Calculate lines needed (add 1 for paragraph spacing)
    const rawLines = Math.ceil(text.length / charsPerLine);
    return Math.ceil(rawLines * headingMultiplier) + 1;
};

export function usePageCalculation({
    content,
    fontSize,
    lineHeight,
    headerHeight = 100,
    controlsHeight = 80,
    horizontalPadding = 20,
    verticalPadding = 24,
}: UsePageCalculationProps): UsePageCalculationResult {
    const { width, height } = useWindowDimensions();

    const pages = useMemo(() => {
        if (!content || content.length === 0) {
            return [];
        }

        // Calculate available space
        const availableHeight = height - headerHeight - controlsHeight - (verticalPadding * 2);
        const availableWidth = width - (horizontalPadding * 2);

        // Calculate how much content fits per page
        const lineHeightPx = fontSize * lineHeight;
        const linesPerPage = Math.floor(availableHeight / lineHeightPx);

        // Approximate characters per line (0.55 is average char width ratio)
        const charsPerLine = Math.floor(availableWidth / (fontSize * 0.55));

        const result: PortableTextBlock[][] = [];
        let currentPage: PortableTextBlock[] = [];
        let currentLines = 0;

        for (const block of content) {
            const blockLines = estimateBlockLines(block, charsPerLine);

            // Special handling for checkpoints and images - they get their own page
            if (block._type === 'checkpoint' || block._type === 'image') {
                // Save current page if it has content
                if (currentPage.length > 0) {
                    result.push(currentPage);
                    currentPage = [];
                    currentLines = 0;
                }
                // Add special block as its own page
                result.push([block]);
                continue;
            }

            // Check if adding this block would overflow the page
            if (currentLines + blockLines > linesPerPage && currentPage.length > 0) {
                result.push(currentPage);
                currentPage = [];
                currentLines = 0;
            }

            currentPage.push(block);
            currentLines += blockLines;
        }

        // Don't forget the last page
        if (currentPage.length > 0) {
            result.push(currentPage);
        }

        return result;
    }, [content, fontSize, lineHeight, width, height, headerHeight, controlsHeight, horizontalPadding, verticalPadding]);

    const findPageByBlockKey = useCallback((blockKey: string | undefined): number => {
        if (!blockKey) return 0;
        const index = pages.findIndex(page =>
            page.some(block => block._key === blockKey)
        );
        return index >= 0 ? index : 0;
    }, [pages]);

    return {
        pages,
        totalPages: pages.length,
        findPageByBlockKey,
    };
}
