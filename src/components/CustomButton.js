import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Image } from 'react-native';

const CustomButton = ({ onPress, title, style, textStyle, imageSource, imageStyle }) => {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.button, style]}>
      {imageSource && <Image source={imageSource} style={[styles.image, imageStyle]} />}
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};
const styles = StyleSheet.create({
  button: {
    flexDirection: 'row', // Align items in a row
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
  },
  image: {
    marginRight: 10, // Add some space between image and text
  },
});

export default CustomButton;
