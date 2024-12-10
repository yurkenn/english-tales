import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, spacing, isSmallDevice } from '../../utils/dimensions';

const SettingsButton = ({
  handleOpenModal,
  size = 'normal', // 'small' | 'normal' | 'large'
  color = Colors.white,
}) => {
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return scale(20);
      case 'large':
        return scale(28);
      default:
        return scale(24);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return scale(36);
      case 'large':
        return scale(48);
      default:
        return scale(42);
    }
  };

  return (
    <TouchableOpacity
      onPress={handleOpenModal}
      style={styles.container}
      activeOpacity={0.7}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <LinearGradient
        colors={[Colors.dark500, Colors.dark900]}
        style={[styles.button, { width: getButtonSize(), height: getButtonSize() }]}
      >
        <Icon name="settings-outline" size={getIconSize()} color={color} />
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.xs,
  },
  button: {
    borderRadius: scale(21),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark500,
    // Add subtle shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default SettingsButton;
