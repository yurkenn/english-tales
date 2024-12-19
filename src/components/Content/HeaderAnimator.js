// src/components/Content/HeaderAnimator.js
import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import HeaderNavbar from './HeaderNavbar';
import { hp } from '../../utils/dimensions';

const HEADER_HEIGHT = hp(8);
const IMAGE_HEIGHT = hp(45);

const HeaderAnimator = ({ scrollY, title }) => {
  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollY.value, [0, IMAGE_HEIGHT - HEADER_HEIGHT], [0, 1], 'clamp');

    const backgroundColor = `rgba(22, 22, 22, ${opacity})`;

    return {
      backgroundColor,
    };
  });

  return (
    <Animated.View style={[styles.header, headerStyle]}>
      <HeaderNavbar title={title} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    zIndex: 10,
  },
});

export default HeaderAnimator;
