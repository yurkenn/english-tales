import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, spacing, fontSizes, isSmallDevice } from '../../utils/dimensions';

const SettingItem = ({ icon, label, value, onPress, isLast }) => (
  <TouchableOpacity style={[styles.settingItem, !isLast && styles.settingBorder]} onPress={onPress}>
    <View style={styles.leftContainer}>
      <View style={styles.iconContainer}>
        <Icon name={icon} size={scale(20)} color={Colors.primary} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>

    <View style={styles.rightContainer}>
      {value && <Text style={styles.value}>{value}</Text>}
      <Icon name="chevron-forward" size={scale(20)} color={Colors.gray500} />
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: verticalScale(16),
    backgroundColor: Colors.dark500,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.dark900,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  iconContainer: {
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: isSmallDevice ? fontSizes.md : fontSizes.lg,
    fontWeight: '500',
    color: Colors.white,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  value: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    marginRight: scale(4),
  },
});

export default SettingItem;
