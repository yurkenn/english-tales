import { Dimensions, Image, Platform, StyleSheet, Text, View } from 'react-native';
import React from 'react';

const HeaderNavbar = ({ title }) => {
  return (
    <View style={styles.container}>
      <Image source={require('../../../assets/images/login-image.png')} style={styles.icon} />
    </View>
  );
};

export default HeaderNavbar;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    height: height * 0.13,
  },
  icon: {
    width: 50,
    height: 50,
  },
});
