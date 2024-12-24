import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { fontSizes, hp, layout, moderateScale, wp } from '../utils/dimensions';
import { Colors } from '../constants/colors';
import Icon from './Icons';

const ExploreAllButton = ({ onPress }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.exploreButtonContainer}>
    <LinearGradient
      colors={[Colors.primary, Colors.primary700]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.exploreButton}
    >
      <View style={styles.buttonContent}>
        <View style={styles.buttonLeftContent}>
          <Text style={styles.buttonTitle}>Explore All Tales</Text>
          <Text style={styles.buttonSubtitle}>Discover more tales</Text>
        </View>
        <View style={styles.iconContainer}>
          <Icon name="arrow-forward" size={moderateScale(24)} color={Colors.white} />
        </View>
      </View>
    </LinearGradient>
  </TouchableOpacity>
);

export default ExploreAllButton;

const styles = StyleSheet.create({
  exploreButtonContainer: {
    marginHorizontal: wp(4),
    marginVertical: hp(2),
    borderRadius: layout.borderRadius,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  exploreButton: {
    width: '100%',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonLeftContent: {
    flex: 1,
  },
  buttonTitle: {
    color: Colors.white,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    marginBottom: hp(0.5),
  },
  buttonSubtitle: {
    color: Colors.white + '90',
    fontSize: fontSizes.sm,
  },
  iconContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: wp(3),
  },
});
