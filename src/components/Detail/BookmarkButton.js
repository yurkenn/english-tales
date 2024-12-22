import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import Animated, { withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { scale } from '../../utils/dimensions';

const BookmarkButton = ({ isBookmarked, handleBookmark }) => {
  const buttonStyle = useAnimatedStyle(() => {
    if (isBookmarked) {
      return {
        transform: [{ scale: withSpring(1) }],
      };
    }
    return {
      transform: [{ scale: 1 }],
    };
  });

  return (
    <TouchableOpacity onPress={handleBookmark} activeOpacity={0.7} style={styles.touchable}>
      <Animated.View style={[styles.container, buttonStyle, isBookmarked && styles.activeBg]}>
        <Icon
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={22}
          color={isBookmarked ? Colors.white : Colors.warning}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark800,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
  activeBg: {
    backgroundColor: Colors.warning,
  },
});

export default BookmarkButton;
