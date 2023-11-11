import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Slider from '@react-native-community/slider';
import { Colors } from '../../constants/colors'; // Make sure you import Colors if needed

const FontSizeSettings = ({ changeFontSize, fontSize }) => {
  return (
    <View style={styles.fontSizeSettingsContainer}>
      <Text style={styles.fontSizeTitle}>Font Size</Text>
      <Slider
        style={styles.slider}
        minimumValue={12}
        maximumValue={30}
        step={1}
        value={fontSize}
        onValueChange={changeFontSize}
        minimumTrackTintColor={Colors.white} // Replace with your color
        maximumTrackTintColor={Colors.grey} // Replace with your color
        thumbTintColor={Colors.primary} // Replace with your color
      />
      <Text style={[styles.fontSizeText, { fontSize }]}>{fontSize}</Text>
    </View>
  );
};

export default FontSizeSettings;

const styles = StyleSheet.create({
  fontSizeSettingsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  fontSizeTitle: {
    color: Colors.white, // Replace with your color
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  fontSizeText: {
    color: Colors.white, // Replace with your color
    backgroundColor: Colors.grey, // Replace with your color
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
