import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { scale } from '../../utils/dimensions';

const SettingsButton = ({ handleOpenModal }) => {
  return (
    <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.7} style={styles.touchable}>
      <View style={styles.container}>
        <Icon name="text" size={22} color={Colors.info} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scale(42),
    height: scale(42),
    borderRadius: scale(12),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark800,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: scale(3.84),
    elevation: 5,
  },
});

export default SettingsButton;
