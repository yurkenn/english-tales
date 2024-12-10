import { StyleSheet, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, spacing, isSmallDevice } from '../../utils/dimensions';

const LikeButton = ({
  hasLiked,
  isLoading,
  handleLike,
  handleUnlike,
  size = 'normal', // 'small' | 'normal' | 'large'
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return scale(20);
      case 'large':
        return scale(28);
      default:
        return scale(24);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return scale(36);
      case 'large':
        return scale(48);
      default:
        return scale(42);
    }
  };

  return (
    <TouchableOpacity
      onPress={hasLiked ? handleUnlike : handleLike}
      disabled={isLoading}
      style={styles.container}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={
          hasLiked ? [Colors.error + '20', Colors.error + '40'] : [Colors.dark500, Colors.dark900]
        }
        style={[styles.button, { width: getButtonSize(), height: getButtonSize() }]}
      >
        <Icon
          name={hasLiked ? 'heart' : 'heart-outline'}
          size={getIconSize()}
          color={hasLiked ? Colors.error : Colors.white}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xs,
  },
  button: {
    borderRadius: scale(21),
    justifyContent: 'center',
    alignItems: 'center',
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default LikeButton;
