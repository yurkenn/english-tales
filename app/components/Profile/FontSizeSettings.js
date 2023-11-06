import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import CustomButton from '../CustomButton';
import { Colors } from '../../constants/colors';

const FontSizeSettings = ({ changeFontSize, fontSize }) => (
  <View style={styles.fontSizeSettingsContainer}>
    <Text style={styles.fontSizeTitle}>Font Size</Text>
    <View style={styles.fontSizeAdjustmentContainer}>
      <CustomButton
        title="A-"
        style={[styles.button, styles.fontSizeButton]}
        textStyle={styles.buttonText}
        onPress={() => changeFontSize(Math.max(12, fontSize - 1))} // Prevent going below a minimum font size
      />
      <Text style={[styles.fontSizeText, { fontSize }]}>{fontSize}</Text>
      <CustomButton
        title="A+"
        style={[styles.button, styles.fontSizeButton]}
        textStyle={styles.buttonText}
        onPress={() => changeFontSize(fontSize + 1)} // Increase font size
      />
    </View>
  </View>
);

export default FontSizeSettings;

const styles = StyleSheet.create({
  fontSizeSettingsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
  },
  fontSizeTitle: {
    color: Colors.gray,
    fontSize: 16,
    marginBottom: 8,
  },
  fontSizeAdjustmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontSizeButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 10,
    elevation: 2,
  },
  fontSizeText: {
    color: Colors.white,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: Colors.dark500,
    minWidth: 40,
    textAlign: 'center',
  },
});
