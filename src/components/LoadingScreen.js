import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';
import LoadingAnimation from './Animations/LoadingAnimation';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <LoadingAnimation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoadingScreen;
