import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const LikeButton = ({ hasLiked, isLoading, handleLike, handleUnlike }) => (
  <TouchableOpacity
    style={styles.likeButton}
    onPress={hasLiked ? handleUnlike : handleLike}
    disabled={isLoading}
  >
    <Icon
      name={hasLiked ? 'heart' : 'heart-outline'}
      size={24}
      color={hasLiked ? Colors.error : Colors.white}
    />
  </TouchableOpacity>
);

export default LikeButton;

const styles = StyleSheet.create({
  likeButton: {
    marginHorizontal: 10,
  },
});
