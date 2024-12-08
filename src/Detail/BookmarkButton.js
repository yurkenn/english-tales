import { StyleSheet, TouchableOpacity } from 'react-native';
import React from 'react';
import { Colors } from '../constants/colors';
import Icon from '../components/Icons';

const BookmarkButton = ({ isBookmarked, handleBookmark }) => {
  return (
    <TouchableOpacity onPress={handleBookmark} style={styles.container}>
      <Icon
        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        size={24}
        color={isBookmarked ? Colors.primary : Colors.white}
      />
    </TouchableOpacity>
  );
};

export default BookmarkButton;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 4,
    padding: 4,
  },
});
