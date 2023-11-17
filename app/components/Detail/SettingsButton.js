import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import Icon from '../Icons';

const SettingsButton = ({ handleOpenModal }) => {
  return (
    <TouchableOpacity onPress={handleOpenModal} style={{ marginHorizontal: 10 }}>
      <Icon name="settings-outline" size={24} color="white" />
    </TouchableOpacity>
  );
};

export default SettingsButton;

const styles = StyleSheet.create({});
