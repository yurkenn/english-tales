import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const StatisticCard = ({ icon, value, label }) => (
  <LinearGradient
    colors={['#2A2D3A', '#1F222E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.statCard}
  >
    <View style={styles.statIconContainer}>
      <Icon name={icon} size={24} color={Colors.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

const styles = StyleSheet.create({
  statCard: {
    width: (SCREEN_WIDTH - 55) / 2,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statIconContainer: {
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: SCREEN_WIDTH * 0.06,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  statValue: {
    fontSize: SCREEN_HEIGHT * 0.024,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: SCREEN_HEIGHT * 0.005,
  },
  statLabel: {
    fontSize: SCREEN_HEIGHT * 0.016,
    color: Colors.gray300,
  },
});
