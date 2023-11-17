import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Slider from 'react-native-smooth-slider';
import { Colors } from '../../constants/colors'; // Make sure you import Colors if needed

const FontSizeSettings = ({ fontSize, changeFontSize }) => {
  return (
    <View style={styles.fontSizeSettingsContainer}>
      <Text style={styles.fontSizeTitle}>Font Size</Text>
      <Text style={styles.fontSizeInfo}>Change the font size of the story to your liking.</Text>
      <Slider
        style={styles.slider}
        trackStyle={{
          height: 16,
          borderRadius: 2,
          backgroundColor: 'white',
          borderColor: '#9a9a9a',
          borderWidth: 0.5,
        }}
        thumbStyle={{
          width: 20,
          height: 25,
          borderRadius: 3,
          backgroundColor: '#eaeaea',
          borderColor: '#9a9a9a',
          borderWidth: 1,
        }}
        minimumTrackTintColor={Colors.yellow}
        value={fontSize}
        minimumValue={10}
        maximumValue={30}
        step={1}
        maximumTrackTintColor={Colors.white}
        thumbTintColor={Colors.dark500}
        onValueChange={changeFontSize}
        useNativeDriver={true}
      />
      <Text style={[styles.fontSizeText, { fontSize }]}>{fontSize}</Text>
    </View>
  );
};

export default FontSizeSettings;

const styles = StyleSheet.create({
  fontSizeSettingsContainer: {
    flex: 1,
    backgroundColor: Colors.dark900,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeTitle: {
    color: Colors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
    margin: 10,
  },
  fontSizeText: {
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 10,
  },
  fontSizeInfo: {
    color: Colors.gray,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});
