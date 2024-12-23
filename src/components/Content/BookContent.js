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
          <Text
            key={index}
            style={[
              styles.paragraph,
              {
                fontSize,
                lineHeight: fontSize * 1.6,
              },
            ]}
          >
            <Text
              style={[
                styles.firstLetter,
                {
                  fontSize: fontSize * 2.2,
                  lineHeight: fontSize * 2.4, // First letter için özel line-height
                },
              ]}
            >
              {block.children?.[0]?.text.charAt(0)}
            </Text>
            <Text>
              {block.children?.[0]?.text.slice(1)}
              {block.children
                ?.slice(1)
                .map((child) => child.text)
                .join('')}
            </Text>
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
    marginBottom: spacing.md,
    textAlign: 'left', // justify yerine left kullanıyoruz
    fontFamily: 'serif',
    paddingRight: wp(2), // Sağ tarafa biraz padding ekliyoruz
  },
  firstLetter: {
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: 'serif',
    paddingTop: spacing.xs,
    marginRight: spacing.xs,
  },
});

export default BookContent;
