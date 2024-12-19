// src/components/Content/StoryContent.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useSelector } from 'react-redux';
import { fontSizes, spacing } from '../../utils/dimensions';

const StoryContent = ({ blocks = [] }) => {
  const fontSize = useSelector((state) => state.fontSize.fontSize);

  const renderBlock = (block, index) => {
    switch (block.style) {
      case 'h1':
        return (
          <Text key={index} style={styles.heading1}>
            {block.children?.map((child) => child.text).join('')}
          </Text>
        );
      case 'h2':
        return (
          <Text key={index} style={styles.heading2}>
            {block.children?.map((child) => child.text).join('')}
          </Text>
        );
      default:
        return (
          <Text key={index} style={[styles.paragraph, { fontSize }]}>
            {block.children?.map((child) => child.text).join('')}
          </Text>
        );
    }
  };

  return (
    <View style={styles.container}>{blocks.map((block, index) => renderBlock(block, index))}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  heading1: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginVertical: spacing.md,
  },
  heading2: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginVertical: spacing.sm,
  },
  paragraph: {
    color: Colors.white,
    lineHeight: spacing.xl,
  },
});

export default StoryContent;
