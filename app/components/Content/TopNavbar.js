import { Dimensions, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';

const TopNavbar = ({ title }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

export default TopNavbar;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    height: height * 0.15, // 12% of screen height for dynamic sizing
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: width < 400 ? 18 : 20, // Smaller font size for smaller screens
    fontWeight: '500',
  },
});
