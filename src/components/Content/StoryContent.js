import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking } from 'react-native';
import { Colors } from '../../constants/colors';
import { useFontSize } from '../../store/FontSizeContext';
import { fontSizes, spacing, moderateScale } from '../../utils/dimensions';

const BlockRenderer = ({ block = {}, fontSize }) => {
  const renderChild = (child = {}) => {
    if (typeof child === 'string') {
      return child;
    }

    const marks = child.marks || [];
    let content = child.text || '';

    if (marks.includes('strong')) {
      content = <Text style={styles.bold}>{content}</Text>;
    }
    if (marks.includes('em')) {
      content = <Text style={styles.italic}>{content}</Text>;
    }

    return content;
  };

  const renderLink = (mark, children) => {
    return (
      <TouchableOpacity onPress={() => Linking.openURL(mark.href)} activeOpacity={0.7}>
        <Text style={styles.link}>{children}</Text>
      </TouchableOpacity>
    );
  };

  const renderMarkup = (children = [], markDefs = []) => {
    return children.map((child, index) => {
      if (child.marks?.length > 0) {
        const mark = markDefs.find((def) => child.marks.includes(def._key));
        if (mark?._type === 'link') {
          return renderLink(mark, child.text);
        }
      }
      return renderChild(child);
    });
  };

  const renderBlock = () => {
    switch (block.style) {
      case 'h1':
        return <Text style={styles.h1}>{renderMarkup(block.children, block.markDefs)}</Text>;

      case 'h2':
        return <Text style={styles.h2}>{renderMarkup(block.children, block.markDefs)}</Text>;

      case 'blockquote':
        return (
          <View style={styles.blockquote}>
            <Text style={styles.blockquoteText}>
              {renderMarkup(block.children, block.markDefs)}
            </Text>
          </View>
        );

      case 'bullet':
        return (
          <View style={styles.bulletItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={[styles.paragraphText, { fontSize }]}>
              {renderMarkup(block.children, block.markDefs)}
            </Text>
          </View>
        );

      default:
        return (
          <Text style={[styles.paragraphText, { fontSize }]}>
            {renderMarkup(block.children, block.markDefs)}
          </Text>
        );
    }
  };

  return renderBlock();
};

const StoryContent = ({ blocks = [] }) => {
  const { fontSize } = useFontSize();

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => (
        <View key={block._key || index} style={styles.blockContainer}>
          <BlockRenderer block={block} fontSize={fontSize} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blockContainer: {
    marginBottom: spacing.md,
  },
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginVertical: spacing.md,
    lineHeight: fontSizes.xxl * 1.4,
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginVertical: spacing.sm,
    lineHeight: fontSizes.xl * 1.4,
  },
  paragraphText: {
    color: Colors.white,
    lineHeight: moderateScale(24),
    letterSpacing: 0.3,
  },
  bulletItem: {
    flexDirection: 'row',
    paddingLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  bullet: {
    color: Colors.white,
    marginRight: spacing.sm,
    fontSize: fontSizes.md,
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: spacing.md,
    marginVertical: spacing.sm,
  },
  blockquoteText: {
    color: Colors.gray300,
    fontStyle: 'italic',
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.5,
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});

export default StoryContent;
