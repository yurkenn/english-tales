import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Colors } from '../../constants/colors';
import { wp, hp, moderateScale, fontSizes, spacing, layout } from '../../utils/dimensions';

const StatCard = ({ icon, value, label, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={styles.statCard}>
    <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.statGradient}>
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={moderateScale(24)} color={Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </Animated.View>
);

export default StatCard;

const styles = StyleSheet.create({
  statCard: {
    width: wp(43), // (100 - 12)/2 ≈ 44% to achieve similar width as before
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
  },
  statGradient: {
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1),
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: Colors.gray500,
  },
});
