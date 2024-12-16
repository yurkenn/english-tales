// Update SettingItem.js
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { scale, verticalScale, spacing, fontSizes, wp } from '../../utils/dimensions';

const SettingItem = ({ icon, label, value, onPress, isLast }) => (
  <TouchableOpacity
    style={[styles.settingItem, !isLast && styles.settingMargin]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <LinearGradient
      colors={['#2A2D3A', '#1F222E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.leftContainer}>
        <View style={styles.iconContainer}>
          <Icon name={icon} size={20} color={Colors.primary} />
        </View>
        <Text style={styles.label}>{label}</Text>
      </View>

      <View style={styles.rightContainer}>
        {value && <Text style={styles.value}>{value}</Text>}
        <Icon name="chevron-forward" size={20} color={Colors.gray500} />
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  settingItem: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  settingMargin: {
    marginBottom: spacing.sm,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: spacing.sm,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    fontSize: fontSizes.sm,
    color: Colors.gray300,
  },
});

export default SettingItem;
