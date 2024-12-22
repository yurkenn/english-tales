import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import Animated, { withSpring, useAnimatedStyle, withSequence } from 'react-native-reanimated';
import { scale } from '../../utils/dimensions';

const LikeButton = ({ hasLiked, isLoading, handleLike }) => {
  const buttonStyle = useAnimatedStyle(() => {
    if (hasLiked) {
      return {
        transform: [{ scale: withSequence(withSpring(1.2), withSpring(1)) }],
      };
    }
    return {
      transform: [{ scale: 1 }],
    };
  });

  return (
    <TouchableOpacity
      onPress={handleLike}
      disabled={isLoading}
      activeOpacity={0.7}
      style={styles.touchable}
    >
      <Animated.View style={[styles.container, buttonStyle, hasLiked && styles.activeBg]}>
        <Icon
          name={hasLiked ? 'heart' : 'heart-outline'}
          size={22}
          color={hasLiked ? Colors.white : Colors.primary}
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
    backgroundColor: Colors.primary,
  },
});

export default LikeButton;
