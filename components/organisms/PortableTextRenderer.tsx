import React from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/services/sanity/client';
import { CheckpointItem } from '../molecules';

interface PortableTextRendererProps {
    content: PortableTextBlock[];
    fontSize: number;
    lineHeight: number;
    textColor: string;
    onWordPress?: (word: string) => void;
    dyslexicFontEnabled?: boolean;
}

export const PortableTextRenderer: React.FC<PortableTextRendererProps> = ({
    content,
    fontSize,
    lineHeight,
    textColor,
    onWordPress,
    dyslexicFontEnabled,
}) => {
    const { theme } = useUnistyles();

    if (!content || !Array.isArray(content)) {
        return <Text style={[styles.paragraph, { fontSize, color: textColor, lineHeight: fontSize * lineHeight }]}>No content available.</Text>;
    }

    const renderChildren = (children: any[], isFirstParagraph = false) => {
        return children.map((child, index) => {
            if (child._type === 'span') {
                let style: any = {
                    fontSize,
                    color: textColor,
                    lineHeight: fontSize * lineHeight,
                    letterSpacing: dyslexicFontEnabled ? 0.8 : 0.3,
                    fontFamily: theme.typography.fontFamily.body,
                };

                // Apply marks (bold, italic, underline)
                if (child.marks && child.marks.length > 0) {
                    child.marks.forEach((mark: string) => {
                        if (mark === 'strong') {
                            style.fontFamily = theme.typography.fontFamily.bold;
                            style.fontWeight = '700';
                        } else if (mark === 'em') {
                            style.fontStyle = 'italic';
                        } else if (mark === 'underline') {
                            style.textDecorationLine = 'underline';
                        }
                    });
                }

                if (onWordPress) {
                    // Split text into words while preserving spaces
                    let text = child.text;
                    let dropCapLetter = '';

                    // Handle Drop Cap for the first span of the first block
                    if (isFirstParagraph && index === 0 && text.length > 0 && !dyslexicFontEnabled) {
                        dropCapLetter = text.charAt(0);
                        text = text.substring(1);
                    }

                    const words = text.split(/(\s+)/);

                    return (
                        <Text key={index} style={style}>
                            {dropCapLetter ? (
                                <Text style={[styles.dropCap, { color: theme.colors.primary, fontSize: fontSize * 2.5 }]}>
                                    {dropCapLetter}
                                </Text>
                            ) : null}
                            {words.map((part: string, wordIdx: number) => {
                                if (part.trim() === '') {
                                    return <Text key={wordIdx}>{part}</Text>;
                                }
                                return (
                                    <Text
                                        key={wordIdx}
                                        onPress={() => onWordPress(part)}
                                        suppressHighlighting={false}
                                        style={styles.word}
                                    >
                                        {part}
                                    </Text>
                                );
                            })}
                        </Text>
                    );
                }

                return <Text key={index} style={style}>{child.text}</Text>;
            }
            return null;
        });
    };

    const renderBlock = (block: any, index: number, isFirst: boolean) => {
        // Handle images
        if (block._type === 'image') {
            const imageUrl = block.asset ? urlFor(block).width(800).url() : null;
            if (imageUrl) {
                return (
                    <View key={index} style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        {block.caption && (
                            <Text style={[styles.caption, { color: theme.colors.textSecondary }]}>{block.caption}</Text>
                        )}
                    </View>
                );
            }
            return null;
        }

        // Handle text blocks
        if (block._type === 'checkpoint') {
            return (
                <CheckpointItem
                    key={index}
                    question={block.question}
                    options={block.options}
                    correctIndex={block.correctIndex}
                    textColor={textColor}
                    onComplete={() => { }}
                />
            );
        }

        if (block._type !== 'block' || !block.children) {
            return null;
        }

        const blockStyle = block.style || 'normal';

        switch (blockStyle) {
            case 'h2':
                return (
                    <Text key={index} style={[styles.heading2, { color: textColor, fontFamily: theme.typography.fontFamily.heading }]}>
                        {renderChildren(block.children)}
                    </Text>
                );
            case 'h3':
                return (
                    <Text key={index} style={[styles.heading3, { color: textColor, fontFamily: theme.typography.fontFamily.heading }]}>
                        {renderChildren(block.children)}
                    </Text>
                );
            case 'blockquote':
                return (
                    <View key={index} style={[styles.blockquote, { borderLeftColor: theme.colors.primary + '40' }]}>
                        <Text style={[styles.blockquoteText, { fontSize: fontSize * 1.05, color: textColor, lineHeight: fontSize * lineHeight * 1.1 }]}>
                            {renderChildren(block.children)}
                        </Text>
                    </View>
                );
            default:
                return (
                    <Text key={index} style={[
                        styles.paragraph,
                        {
                            fontSize,
                            color: textColor,
                            lineHeight: fontSize * lineHeight,
                            letterSpacing: dyslexicFontEnabled ? 1 : 0.2,
                        }
                    ]}>
                        {renderChildren(block.children, isFirst)}
                    </Text>
                );
        }
    };

    return (
        <View style={styles.container}>
            {content.map((block, index) => renderBlock(block, index, index === 0))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        gap: theme.spacing.xl,
    },
    paragraph: {
        textAlign: 'left',
    },
    word: {
        // Subtle feedback background can be added if needed
    },
    dropCap: {
        fontWeight: '900',
        lineHeight: 0, // Let it hang
        paddingRight: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    heading2: {
        fontSize: theme.typography.size.xxxl,
        marginTop: theme.spacing.xl,
        marginBottom: theme.spacing.sm,
        letterSpacing: -0.5,
    },
    heading3: {
        fontSize: theme.typography.size.xxl,
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xs,
        letterSpacing: -0.3,
    },
    blockquote: {
        borderLeftWidth: 4,
        paddingLeft: theme.spacing.xl,
        marginVertical: theme.spacing.xl,
        backgroundColor: theme.colors.primary + '08',
        paddingVertical: theme.spacing.lg,
        borderRadius: theme.radius.sm,
    },
    blockquoteText: {
        fontStyle: 'italic',
        opacity: 0.9,
    },
    imageContainer: {
        marginVertical: theme.spacing.xxl,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        aspectRatio: 16 / 9,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colors.borderLight,
    },
    caption: {
        fontSize: theme.typography.size.sm,
        marginTop: theme.spacing.md,
        textAlign: 'center',
        fontStyle: 'italic',
        opacity: 0.6,
    },
}));
