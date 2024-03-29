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
    height: height * 0.15,
    width: width,
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: Colors.white,
    fontSize: height * 0.02,
    fontWeight: '500',
  },
});
