import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Colors } from '../constants/colors';
import Icon from './Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, spacing, isSmallDevice } from '../utils/dimensions';

const BookmarkButton = ({ isBookmarked, handleBookmark }) => {
  return (
    <TouchableOpacity
      onPress={handleBookmark}
      style={styles.container}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <LinearGradient colors={[Colors.dark500, Colors.dark900]} style={styles.button}>
        <Icon
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={scale(24)}
          color={isBookmarked ? Colors.primary : Colors.white}
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
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark500,
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

export default BookmarkButton;
