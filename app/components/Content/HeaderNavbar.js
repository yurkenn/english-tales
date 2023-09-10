import { Platform, StyleSheet, Text, View } from 'react-native';
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

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: Colors.dark900,
  },
  title: {},
});
