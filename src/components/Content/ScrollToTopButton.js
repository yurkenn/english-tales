// src/components/Content/ScrollToTopButton.js
import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { scale, spacing } from '../../utils/dimensions';

const BUTTON_SIZE = 40;

const ScrollToTopButton = ({ scrollY, onPress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollY.value, [0, 200], [0, 1], 'clamp');

    return {
      transform: [
        {
          scale: withSpring(scale, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      opacity: withTiming(scale, {
        duration: 200,
      }),
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.6}>
        <Icon name="chevron-up" size={20} color={Colors.white} />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    zIndex: 10,
    // Remove opacity from here since it's handled by animation
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: Colors.primary + 'CC',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default ScrollToTopButton;
