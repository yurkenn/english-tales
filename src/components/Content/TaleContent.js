import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import PortableText from 'react-portable-text';
import { Colors } from '../../constants/colors';
import { useFontSize } from '../../store/FontSizeContext';
import { moderateScale, verticalScale, spacing, fontSizes } from '../../utils/dimensions';

const TaleContent = ({ blocks }) => {
  const { fontSize } = useFontSize();

  const getScaledFontSize = (baseSize) => {
    return moderateScale(parseInt(fontSize) + baseSize);
  };

  return (
    <View style={styles.container}>
      <PortableText
        content={blocks}
        serializers={{
          h1: ({ children }) => <Text style={styles.h1}>{children}</Text>,
          h2: ({ children }) => <Text style={styles.h2}>{children}</Text>,
          li: ({ children }) => <Text style={styles.li}>• {children}</Text>,
          normal: ({ children }) => (
            <Text style={[styles.normal, { fontSize: getScaledFontSize(0) }]}>{children}</Text>
          ),
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
  },
  h1: {
    fontSize: fontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.white,
    marginVertical: spacing.md,
    lineHeight: moderateScale(32),
  },
  h2: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginVertical: spacing.sm,
    lineHeight: moderateScale(28),
  },
  li: {
    fontSize: fontSizes.md,
    color: Colors.white,
    marginVertical: spacing.xs,
    paddingLeft: spacing.sm,
    lineHeight: moderateScale(24),
  },
  normal: {
    color: Colors.white,
    marginBottom: spacing.sm,
    lineHeight: moderateScale(24),
    letterSpacing: 0.5,
  },
});

export default TaleContent;
