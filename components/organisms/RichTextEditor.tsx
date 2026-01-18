import { FC, useCallback, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme, Theme } from '@/theme';
import {
    RichText,
    Toolbar,
    useEditorBridge,
    DEFAULT_TOOLBAR_ITEMS,
    TenTapStartKit,
    PlaceholderBridge,
    CoreBridge,
} from '@10play/tentap-editor';
import { Typography } from '@/components/atoms/Typography';
import { useTranslation } from 'react-i18next';

interface RichTextEditorProps {
    readonly initialContent?: string;
    readonly onChange: (content: string) => void;
    readonly placeholder?: string;
    readonly minHeight?: number;
}

/**
 * Rich Text Editor wrapper using @10play/tentap-editor
 * Provides formatting toolbar with Bold, Italic, Lists, etc.
 */
export const RichTextEditor: FC<RichTextEditorProps> = memo(({
    initialContent = '',
    onChange,
    placeholder = 'Start writing...',
    minHeight = 300,
}) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = createStyles(theme, minHeight);

    // Initialize editor bridge
    const editor = useEditorBridge({
        autofocus: false,
        avoidIosKeyboard: true,
        initialContent,
        bridgeExtensions: [
            ...TenTapStartKit,
            PlaceholderBridge.configureExtension({
                placeholder,
            }),
            CoreBridge.configureCSS(`
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 16px;
                    line-height: 1.6;
                    color: ${theme.colors.text};
                    background-color: ${theme.colors.surface};
                    padding: 16px;
                    margin: 0;
                }
                p {
                    margin: 0 0 12px 0;
                }
                strong {
                    font-weight: 700;
                }
                em {
                    font-style: italic;
                }
                ul, ol {
                    margin: 8px 0;
                    padding-left: 24px;
                }
                li {
                    margin: 4px 0;
                }
                blockquote {
                    border-left: 3px solid ${theme.colors.primary};
                    margin: 12px 0;
                    padding-left: 16px;
                    color: ${theme.colors.textMuted};
                    font-style: italic;
                }
                h2 {
                    font-size: 20px;
                    font-weight: 700;
                    margin: 16px 0 8px 0;
                }
                h3 {
                    font-size: 18px;
                    font-weight: 600;
                    margin: 12px 0 6px 0;
                }
                .ProseMirror-focused {
                    outline: none;
                }
                .ProseMirror p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: ${theme.colors.textMuted};
                    pointer-events: none;
                    height: 0;
                }
            `),
        ],
        onChange: useCallback(async () => {
            const html = await editor.getHTML();
            onChange(html);
        }, [onChange]),
    });

    return (
        <View style={styles.container}>
            {/* Toolbar */}
            <View style={styles.toolbarContainer}>
                <Toolbar
                    editor={editor}
                    items={DEFAULT_TOOLBAR_ITEMS}
                />
            </View>

            {/* Editor */}
            <View style={styles.editorContainer}>
                <RichText editor={editor} />
            </View>

            {/* Helper text */}
            <Typography variant="caption" style={styles.hint}>
                {t('write.editor.formatHint', 'Select text to format')}
            </Typography>
        </View>
    );
});

RichTextEditor.displayName = 'RichTextEditor';

function createStyles(theme: Theme, minHeight: number) {
    return StyleSheet.create({
        container: {
            gap: theme.spacing.sm,
        },
        toolbarContainer: {
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            overflow: 'hidden',
        },
        editorContainer: {
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: theme.colors.borderLight,
            minHeight,
            overflow: 'hidden',
        },
        hint: {
            color: theme.colors.textMuted,
            fontStyle: 'italic',
            textAlign: 'right',
        },
    });
}

export default RichTextEditor;
