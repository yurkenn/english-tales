import { StyleSheet, Text, View } from 'react-native';
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

const styles = StyleSheet.create({
  container: {
    height: 40,
  },
  title: {
    color: Colors.cardBackground,
    fontSize: 20,
    fontWeight: '500',
  },
});
