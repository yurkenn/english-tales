// src/utils/dimensions.js
import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (based on standard mobile screen)
const baseWidth = 375;
const baseHeight = 812;

// Scaling factors
const widthScale = SCREEN_WIDTH / baseWidth;
const heightScale = SCREEN_HEIGHT / baseHeight;

// Responsive dimensions functions
export const wp = (dimension) => {
  return SCREEN_WIDTH * (dimension / 100);
};

export const hp = (dimension) => {
  return SCREEN_HEIGHT * (dimension / 100);
};

// Scale dimensions based on screen size
export const scale = (size) => {
  return Math.round(size * widthScale);
};

// Scale vertical dimensions
export const verticalScale = (size) => {
  return Math.round(size * heightScale);
};

// Moderate scaling for fonts and elements that shouldn't scale too dramatically
export const moderateScale = (size, factor = 0.5) => {
  return Math.round(size + (scale(size) - size) * factor);
};

// Common spacing units
export const spacing = {
  xs: scale(4),
  sm: scale(8),
  md: scale(16),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
};

// Font sizes
export const fontSizes = {
  xs: moderateScale(12),
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  xxxl: moderateScale(32),
};

// Layout constants
export const layout = {
  windowWidth: SCREEN_WIDTH,
  windowHeight: SCREEN_HEIGHT,
  headerHeight: verticalScale(60),
  bottomTabHeight: verticalScale(50),
  borderRadius: scale(8),
};

// Device size detection
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = SCREEN_WIDTH >= 414;
