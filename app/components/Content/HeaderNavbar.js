import { Platform, StyleSheet, Text, View } from 'react-native';
import React from 'react';

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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 24 : 0,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
  },
  title: {
    color: '#fff',
    fontSize: Platform.OS === 'ios' ? 30 : 25,
    fontWeight: 'bold',
  },
});
