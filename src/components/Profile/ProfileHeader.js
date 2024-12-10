import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';
import {
  scale,
  verticalScale,
  moderateScale,
  spacing,
  fontSizes,
  wp,
  hp,
  isSmallDevice,
} from '../../utils/dimensions';

export const ProfileHeader = ({ userInfo, isLoading, onImagePress, onEditPress }) => (
  <LinearGradient
    colors={['#2A2D3A', '#1F222E']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <TouchableOpacity onPress={onImagePress} disabled={isLoading}>
      <View style={styles.imageContainer}>
        <Image
          source={
            userInfo?.photoURL
              ? { uri: userInfo.photoURL }
              : require('../../../assets/images/blank-profile.png')
          }
          style={styles.profileImage}
        />
        <LinearGradient colors={[Colors.primary, Colors.primary700]} style={styles.editBadge}>
          <Icon name="camera" size={16} color={Colors.white} />
        </LinearGradient>
      </View>
    </TouchableOpacity>

    <Text style={styles.userName}>
      {userInfo?.displayName || userInfo?.email?.split('@')[0] || 'Reader'}
    </Text>
    <Text style={styles.userEmail}>{userInfo?.email}</Text>

    <TouchableOpacity onPress={onEditPress} style={styles.editProfileButton}>
      <Text style={styles.editProfileText}>Edit Profile</Text>
    </TouchableOpacity>
  </LinearGradient>
);

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: verticalScale(30),
    paddingHorizontal: spacing.lg,
    backgroundColor: Colors.dark500,
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: verticalScale(15),
  },
  profileImage: {
    width: scale(100),
    height: scale(100),
    borderRadius: scale(50),
    borderWidth: scale(3),
    borderColor: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: scale(8),
    borderRadius: scale(12),
    borderWidth: scale(3),
    borderColor: Colors.dark900,
  },
  userName: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: verticalScale(5),
  },
  userEmail: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    marginBottom: verticalScale(15),
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: scale(12),
    paddingVertical: verticalScale(6),
    borderRadius: scale(20),
    gap: scale(6),
  },
  levelText: {
    color: Colors.primary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  statsContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: verticalScale(15),
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: scale(15),
  },
  statCard: {
    width: (wp(100) - spacing.lg * 3) / 2, // Accounting for padding and gap
    backgroundColor: Colors.dark500,
    borderRadius: scale(15),
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    width: scale(45),
    height: scale(45),
    borderRadius: scale(22.5),
    backgroundColor: Colors.dark900 + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(10),
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: verticalScale(5),
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
  },
  settingsContainer: {
    padding: spacing.lg,
  },
  settingsCard: {
    backgroundColor: Colors.dark500,
    borderRadius: scale(15),
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark900,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(12),
  },
  settingIconContainer: {
    width: scale(36),
    height: scale(36),
    borderRadius: scale(18),
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: fontSizes.md,
    color: Colors.white,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
  },
  settingValue: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
  },
});
