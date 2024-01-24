import { Dimensions, StyleSheet, Text, View } from 'react-native';
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
        onValueChange={(value) => changeFontSize(value)}
        onSlidingComplete={(value) => changeFontSize(value)}
        useNativeDriver={true}
      />
      <Text style={styles.fontSizeText}>{fontSize}</Text>
    </View>
  );
};

export default FontSizeSettings;

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  fontSizeSettingsContainer: {
    flex: 1,
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontSizeTitle: {
    color: Colors.white,
    fontSize: windowWidth * 0.045,
    fontWeight: 'bold',
    marginBottom: windowHeight * 0.01,
    marginTop: windowHeight * 0.02,
  },
  slider: {
    width: windowWidth * 0.8,
    height: windowHeight * 0.05,
  },
  fontSizeText: {
    fontSize: windowWidth * 0.045,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: windowHeight * 0.02,
  },
  fontSizeInfo: {
    color: Colors.gray,
    fontSize: windowWidth * 0.033,
    textAlign: 'center',
    marginBottom: windowHeight * 0.03,
  },
});
