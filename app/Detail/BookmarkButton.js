import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../constants/colors';
import Icon from '../components/Icons';

const BookmarkButton = ({ isBookmarked, handleBookmark }) => {
  return (
    <TouchableOpacity onPress={handleBookmark}>
      <Icon
        name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
        size={24}
        color={isBookmarked ? Colors.yellow : Colors.white}
      />
    </TouchableOpacity>
  );
};

export default BookmarkButton;

const styles = StyleSheet.create({});
