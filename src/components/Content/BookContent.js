// src/components/Content/BookContent.js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { useSelector } from 'react-redux';
import { fontSizes, spacing, wp } from '../../utils/dimensions';

const BookContent = ({ blocks = [] }) => {
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
            <Text style={styles.firstLetter}>{block.children?.[0]?.text.charAt(0)}</Text>
            {block.children?.[0]?.text.slice(1)}
            {block.children
              ?.slice(1)
              .map((child) => child.text)
              .join('')}
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
    paddingHorizontal: wp(5),
  },
  heading1: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginVertical: spacing.lg,
    textAlign: 'center',
    fontFamily: 'serif',
  },
  heading2: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginVertical: spacing.md,
    fontFamily: 'serif',
  },
  paragraph: {
    color: Colors.white,
    lineHeight: spacing.xl * 1.5,
    marginBottom: spacing.md,
    textAlign: 'justify',
    fontFamily: 'serif',
  },
  firstLetter: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'serif',
  },
});

export default BookContent;
