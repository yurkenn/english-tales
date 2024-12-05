import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Slider from 'react-native-smooth-slider';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import Animated, { FadeIn } from 'react-native-reanimated';

const FontSizeSettings = ({ fontSize, changeFontSize }) => {
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
        minimumTrackTintColor={Colors.yellow}
        value={fontSize}
        minimumValue={10}
        maximumValue={30}
        step={1}
        maximumTrackTintColor={Colors.white}
        thumbTintColor={Colors.dark500}
        onValueChange={changeFontSize}
        onSlidingComplete={changeFontSize}
      />

      <Text style={styles.sizeValue}>{fontSize}px</Text>
    </Animated.View>
  );
};

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    padding: windowWidth * 0.05,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: windowHeight * 0.02,
  },
  title: {
    color: Colors.white,
    fontSize: windowWidth * 0.05,
    fontWeight: '700',
    marginBottom: windowHeight * 0.01,
  },
  subtitle: {
    color: Colors.gray500,
    fontSize: windowWidth * 0.035,
  },
  previewBox: {
    width: '100%',
    padding: windowHeight * 0.02,
    backgroundColor: Colors.dark500,
    borderRadius: 20,
    marginBottom: windowHeight * 0.02,
    alignItems: 'center',
  },
  previewText: {
    color: Colors.white,
  },
  slider: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.05,
  },
  track: {
    height: 13,
    borderRadius: 8,
    backgroundColor: Colors.dark500,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  sizeValue: {
    fontSize: windowWidth * 0.045,
    fontWeight: '600',
    color: Colors.white,
    marginTop: windowHeight * 0.02,
  },
});

export default FontSizeSettings;
