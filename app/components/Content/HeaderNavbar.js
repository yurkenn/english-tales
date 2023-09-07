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
    color: '#000',
    fontSize: Platform.OS === 'ios' ? 30 : 25,
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.8)', // White text shadow
    textShadowOffset: { width: 0, height: 1 }, // Adjust the offset for desired effect
    textShadowRadius: 10, // Adjust the radius for desired effect
  },
});
