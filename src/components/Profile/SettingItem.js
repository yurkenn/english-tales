import React from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, Dimensions } from 'react-native';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SettingItem = ({
  icon,
  label,
  value,
  onPress,
  isLast,
  isToggle,
  isActive,
  onToggle,
}) => (
  <TouchableOpacity
    style={[styles.settingItem, !isLast && styles.settingBorder]}
    onPress={onPress}
    disabled={isToggle}
  >
    <View style={styles.settingLeft}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {isToggle ? (
        <Switch
          value={isActive}
          onValueChange={onToggle}
          trackColor={{ false: Colors.dark500, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      ) : (
        <>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Icon name="chevron-forward" size={20} color={Colors.gray300} />
        </>
      )}
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SCREEN_HEIGHT * 0.02,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#1F222E',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.03,
  },
  iconContainer: {
    width: SCREEN_WIDTH * 0.09,
    height: SCREEN_WIDTH * 0.09,
    borderRadius: SCREEN_WIDTH * 0.045,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: SCREEN_HEIGHT * 0.018,
    color: Colors.white,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.02,
  },
  settingValue: {
    fontSize: SCREEN_HEIGHT * 0.016,
    color: Colors.gray300,
  },
});
