import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  wp,
  isSmallDevice,
} from '../../utils/dimensions';

const InfoComponent = ({ readTime, likes }) => (
  <LinearGradient
    colors={[Colors.dark500 + '80', Colors.dark900 + '80']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.container}
  >
    <View style={styles.infoSection}>
      <Icon name="time-outline" size={scale(20)} color={Colors.primary} />
      <View style={styles.textContainer}>
        <Text style={styles.value}>{readTime}</Text>
        <Text style={styles.label}>Read Time</Text>
      </View>
    </View>

    <View style={styles.divider} />

    <View style={styles.infoSection}>
      <Icon name="heart" size={scale(20)} color={Colors.error} />
      <View style={styles.textContainer}>
        <Text style={styles.value}>{likes}</Text>
        <Text style={styles.label}>Likes</Text>
      </View>
    </View>
  </LinearGradient>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: verticalScale(16),
    paddingVertical: verticalScale(16),
    width: wp(90),
    alignSelf: 'center',
    borderRadius: scale(12),
    // Add glassmorphism effect
    backgroundColor: 'rgba(255,255,255,0.05)',
    // Add shadow
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: scale(2),
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  textContainer: {
    marginLeft: spacing.xs,
  },
  value: {
    color: Colors.white,
    fontSize: isSmallDevice ? fontSizes.md : fontSizes.lg,
    fontWeight: '600',
    // Add proper line height for better text alignment
    lineHeight: verticalScale(24),
  },
  label: {
    color: Colors.gray500,
    fontSize: isSmallDevice ? fontSizes.sm : fontSizes.md,
    // Add proper line height for better text alignment
    lineHeight: verticalScale(20),
  },
  divider: {
    width: scale(1),
    height: verticalScale(32),
    backgroundColor: Colors.gray500 + '40',
  },
});

export default InfoComponent;
