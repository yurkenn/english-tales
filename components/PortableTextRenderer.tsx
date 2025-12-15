import React from 'react';
import { View, Text, Image } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { PortableTextBlock } from '@portabletext/types';
import { urlFor } from '@/services/sanity/client';

interface PortableTextRendererProps {
    content: PortableTextBlock[];
    fontSize: number;
    lineHeight: number;
    textColor: string;
}

export const PortableTextRenderer: React.FC<PortableTextRendererProps> = ({
    content,
    fontSize,
    lineHeight,
    textColor,
}) => {
    if (!content || !Array.isArray(content)) {
        return <Text style={[styles.paragraph, { fontSize, color: textColor, lineHeight: fontSize * lineHeight }]}>No content available.</Text>;
    }

    const renderChildren = (children: any[], marks?: any[]) => {
        return children.map((child, index) => {
            if (child._type === 'span') {
                let style: any = { fontSize, color: textColor, lineHeight: fontSize * lineHeight };

                // Apply marks (bold, italic, underline)
                if (child.marks && child.marks.length > 0) {
                    child.marks.forEach((mark: string) => {
                        if (mark === 'strong') {
                            style.fontWeight = 'bold';
                        } else if (mark === 'em') {
                            style.fontStyle = 'italic';
                        } else if (mark === 'underline') {
                            style.textDecorationLine = 'underline';
                        }
                    });
                }

                return <Text key={index} style={style}>{child.text}</Text>;
            }
            return null;
        });
    };

    const renderBlock = (block: any, index: number) => {
        // Handle images
        if (block._type === 'image') {
            const imageUrl = block.asset ? urlFor(block).width(800).url() : null;
            if (imageUrl) {
                return (
                    <View key={index} style={styles.imageContainer}>
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.image}
                            resizeMode="contain"
                        />
                        {block.caption && (
                            <Text style={[styles.caption, { color: textColor }]}>{block.caption}</Text>
                        )}
                    </View>
                );
            }
            return null;
        }

        // Handle text blocks
        if (block._type !== 'block' || !block.children) {
            return null;
        }

        const style = block.style || 'normal';

        switch (style) {
            case 'h2':
                return (
                    <Text key={index} style={[styles.heading2, { color: textColor }]}>
                        {renderChildren(block.children)}
                    </Text>
                );
            case 'h3':
                return (
                    <Text key={index} style={[styles.heading3, { color: textColor }]}>
                        {renderChildren(block.children)}
                    </Text>
                );
            case 'blockquote':
                return (
                    <View key={index} style={styles.blockquote}>
                        <Text style={[styles.blockquoteText, { fontSize, color: textColor, lineHeight: fontSize * lineHeight }]}>
                            {renderChildren(block.children)}
                        </Text>
                    </View>
                );
            default:
                return (
                    <Text key={index} style={[styles.paragraph, { fontSize, color: textColor, lineHeight: fontSize * lineHeight }]}>
                        {renderChildren(block.children)}
                    </Text>
                );
        }
    };

    return (
        <View style={styles.container}>
            {content.map((block, index) => renderBlock(block, index))}
        </View>
    );
};

const styles = StyleSheet.create((theme) => ({
    container: {
        gap: theme.spacing.lg,
    },
    paragraph: {
        letterSpacing: 0.3,
    },
    heading2: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.sm,
    },
    heading3: {
        fontSize: 20,
        fontWeight: '600',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    blockquote: {
        borderLeftWidth: 3,
        borderLeftColor: theme.colors.primary,
        paddingLeft: theme.spacing.lg,
        marginVertical: theme.spacing.md,
        opacity: 0.9,
    },
    blockquoteText: {
        fontStyle: 'italic',
    },
    imageContainer: {
        marginVertical: theme.spacing.lg,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: 200,
        borderRadius: theme.radius.lg,
    },
    caption: {
        fontSize: 12,
        marginTop: theme.spacing.sm,
        textAlign: 'center',
        opacity: 0.7,
    },
}));
