import { Dimensions, Platform, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';

const HeaderNavbar = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default HeaderNavbar;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? height * 0.1 : 80, // Adjust for iOS and Android
    backgroundColor: Colors.dark900,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
  },
  title: {
    color: Colors.white,
    fontSize: width < 400 ? 18 : 20, // Adjust font size for different screen widths
    fontWeight: '500',
  },
});
