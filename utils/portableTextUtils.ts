/**
 * Portable Text Conversion Utilities
 * 
 * Converts between Tiptap HTML and Sanity Portable Text format
 */

import { nanoid } from 'nanoid/non-secure';

interface PortableTextBlock {
    _type: 'block';
    _key: string;
    style: 'normal' | 'h2' | 'h3' | 'blockquote';
    markDefs: any[];
    children: Array<{
        _type: 'span';
        _key: string;
        text: string;
        marks?: string[];
    }>;
    listItem?: 'bullet' | 'number';
    level?: number;
}

/**
 * Convert HTML content to Portable Text blocks
 * Basic implementation for common formatting
 */
export function htmlToPortableText(html: string): PortableTextBlock[] {
    if (!html || html === '<p></p>') {
        return [];
    }

    const blocks: PortableTextBlock[] = [];

    // Simple HTML parser using regex (for basic elements)
    // In production, consider using a proper HTML parser
    const tempDiv = html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '</p>\n')
        .replace(/<\/h[23]>/gi, '</h>\n')
        .replace(/<\/li>/gi, '</li>\n')
        .replace(/<\/blockquote>/gi, '</blockquote>\n');

    // Split by line breaks and process each block
    const lines = tempDiv.split('\n').filter(line => line.trim());

    let currentListType: 'bullet' | 'number' | null = null;
    let listLevel = 1;

    for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Detect block type
        let style: PortableTextBlock['style'] = 'normal';
        let listItem: 'bullet' | 'number' | undefined;
        let content = trimmedLine;

        // Check for headings
        if (/<h2[^>]*>/i.test(content)) {
            style = 'h2';
            content = content.replace(/<\/?h2[^>]*>/gi, '');
        } else if (/<h3[^>]*>/i.test(content)) {
            style = 'h3';
            content = content.replace(/<\/?h3[^>]*>/gi, '');
        } else if (/<blockquote[^>]*>/i.test(content)) {
            style = 'blockquote';
            content = content.replace(/<\/?blockquote[^>]*>/gi, '');
        } else if (/<ul[^>]*>/i.test(content)) {
            currentListType = 'bullet';
            continue;
        } else if (/<ol[^>]*>/i.test(content)) {
            currentListType = 'number';
            continue;
        } else if (/<\/ul>|<\/ol>/i.test(content)) {
            currentListType = null;
            continue;
        } else if (/<li[^>]*>/i.test(content)) {
            listItem = currentListType || 'bullet';
            content = content.replace(/<\/?li[^>]*>/gi, '');
        }

        // Remove paragraph tags
        content = content.replace(/<\/?p[^>]*>/gi, '');

        // Parse inline marks (bold, italic)
        const children = parseInlineMarks(content);

        if (children.length > 0) {
            const block: PortableTextBlock = {
                _type: 'block',
                _key: nanoid(12),
                style,
                markDefs: [],
                children,
            };

            if (listItem) {
                block.listItem = listItem;
                block.level = listLevel;
            }

            blocks.push(block);
        }
    }

    return blocks.length > 0 ? blocks : [{
        _type: 'block',
        _key: nanoid(12),
        style: 'normal',
        markDefs: [],
        children: [{ _type: 'span', _key: nanoid(12), text: '' }],
    }];
}

/**
 * Parse inline marks (bold, italic) from HTML
 */
function parseInlineMarks(html: string): Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }> {
    const children: Array<{ _type: 'span'; _key: string; text: string; marks?: string[] }> = [];

    // Strip HTML tags but track marks
    // This is simplified - in production use a proper parser
    let currentText = '';
    let currentMarks: string[] = [];
    let i = 0;
    const chars = html.split('');

    while (i < chars.length) {
        if (chars[i] === '<') {
            // Check for tag
            const endTag = html.indexOf('>', i);
            if (endTag !== -1) {
                const tag = html.substring(i, endTag + 1);

                // Save current span if there's text
                if (currentText) {
                    children.push({
                        _type: 'span',
                        _key: nanoid(12),
                        text: currentText,
                        marks: currentMarks.length > 0 ? [...currentMarks] : undefined,
                    });
                    currentText = '';
                }

                // Handle tags
                if (/<strong>|<b>/i.test(tag)) {
                    currentMarks.push('strong');
                } else if (/<\/strong>|<\/b>/i.test(tag)) {
                    currentMarks = currentMarks.filter(m => m !== 'strong');
                } else if (/<em>|<i>/i.test(tag)) {
                    currentMarks.push('em');
                } else if (/<\/em>|<\/i>/i.test(tag)) {
                    currentMarks = currentMarks.filter(m => m !== 'em');
                }

                i = endTag + 1;
                continue;
            }
        }

        currentText += chars[i];
        i++;
    }

    // Add remaining text
    if (currentText) {
        children.push({
            _type: 'span',
            _key: nanoid(12),
            text: currentText,
            marks: currentMarks.length > 0 ? [...currentMarks] : undefined,
        });
    }

    return children.length > 0 ? children : [{ _type: 'span', _key: nanoid(12), text: '' }];
}

/**
 * Convert Portable Text blocks back to HTML for editor
 */
export function portableTextToHtml(blocks: PortableTextBlock[]): string {
    if (!blocks || blocks.length === 0) {
        return '';
    }

    let html = '';
    let inList: 'bullet' | 'number' | null = null;

    for (const block of blocks) {
        // Handle list items
        if (block.listItem) {
            if (inList !== block.listItem) {
                if (inList) html += inList === 'bullet' ? '</ul>' : '</ol>';
                html += block.listItem === 'bullet' ? '<ul>' : '<ol>';
                inList = block.listItem;
            }
        } else if (inList) {
            html += inList === 'bullet' ? '</ul>' : '</ol>';
            inList = null;
        }

        // Build content from children
        let content = '';
        for (const child of block.children || []) {
            let text = child.text || '';

            // Apply marks
            if (child.marks?.includes('strong')) {
                text = `<strong>${text}</strong>`;
            }
            if (child.marks?.includes('em')) {
                text = `<em>${text}</em>`;
            }

            content += text;
        }

        // Wrap in appropriate tag
        if (block.listItem) {
            html += `<li>${content}</li>`;
        } else {
            switch (block.style) {
                case 'h2':
                    html += `<h2>${content}</h2>`;
                    break;
                case 'h3':
                    html += `<h3>${content}</h3>`;
                    break;
                case 'blockquote':
                    html += `<blockquote>${content}</blockquote>`;
                    break;
                default:
                    html += `<p>${content}</p>`;
            }
        }
    }

    // Close any open lists
    if (inList) {
        html += inList === 'bullet' ? '</ul>' : '</ol>';
    }

    return html;
}

/**
 * Extract plain text and count words
 */
export function getWordCount(html: string): number {
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Extract plain text from HTML
 */
export function htmlToPlainText(html: string): string {
    return html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim();
}
