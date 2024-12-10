import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Slider from 'react-native-smooth-slider';
import { Colors } from '../../constants/colors';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useFontSize } from '../../store/FontSizeContext';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  wp,
  hp,
  isSmallDevice,
} from '../../utils/dimensions';
const FontSizeSettings = () => {
  const { fontSize, changeFontSize } = useFontSize();

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Font Size</Text>
        <Text style={styles.subtitle}>Change the font size of the story to your liking.</Text>
      </View>

      <View style={styles.previewBox}>
        <Text style={[styles.previewText, { fontSize }]}>Preview Text</Text>
      </View>

      <Slider
        style={styles.slider}
        trackStyle={styles.track}
        thumbStyle={styles.thumb}
        minimumTrackTintColor={Colors.primary}
        value={fontSize}
        minimumValue={14}
        maximumValue={24}
        step={1}
        maximumTrackTintColor={Colors.gray500}
        thumbTintColor={Colors.white}
        onValueChange={changeFontSize}
      />

      <Text style={styles.sizeValue}>{fontSize}px</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    padding: spacing.lg,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: verticalScale(16),
  },
  title: {
    color: Colors.white,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    marginBottom: verticalScale(8),
  },
  subtitle: {
    color: Colors.gray500,
    fontSize: fontSizes.md,
  },
  previewBox: {
    width: '100%',
    padding: spacing.lg,
    backgroundColor: Colors.dark500,
    borderRadius: scale(20),
    marginBottom: verticalScale(16),
    alignItems: 'center',
  },
  previewText: {
    color: Colors.white,
  },
  slider: {
    width: wp(80),
    height: verticalScale(40),
  },
  track: {
    height: verticalScale(13),
    borderRadius: scale(8),
    backgroundColor: Colors.dark500,
  },
  thumb: {
    width: scale(24),
    height: scale(24),
    borderRadius: scale(12),
    backgroundColor: Colors.white,
  },
  sizeValue: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginTop: verticalScale(16),
  },
});

export default FontSizeSettings;
