import React from 'react';
import { StyleSheet, Image, Platform, View } from 'react-native';
import { scale, verticalScale, spacing, layout, isSmallDevice } from '../../utils/dimensions';

const HeaderNavbar = ({ title }) => {
  return <View style={styles.container}></View>;
};

const styles = StyleSheet.create({
  container: {
    height: verticalScale(100),
  },
});

export default HeaderNavbar;
