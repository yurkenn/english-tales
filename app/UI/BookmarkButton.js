import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { BookmarkIcon } from './SvgIcons';

const BookmarkButton = () => {
  return (
    <TouchableOpacity style={styles.button}>
      <BookmarkIcon />
    </TouchableOpacity>
  );
};

export default BookmarkButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#000000',
    flex: 1,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    height: 32,
    width: 32,
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
});
