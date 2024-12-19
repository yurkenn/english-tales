// src/components/Profile/ProfileHeader.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';
import Icon from '../Icons';
import { wp, hp, scale, fontSizes, spacing } from '../../utils/dimensions';

const ProfileHeader = ({ userInfo, readerLevel, isLoading }) => {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={
            userInfo?.photoURL
              ? { uri: userInfo.photoURL }
              : require('../../../assets/images/blank-profile.png')
          }
          style={styles.profileImage}
        />
      </View>

      <Text style={styles.userName}>{userInfo?.displayName || 'Reader'}</Text>
      <Text style={styles.userEmail}>{userInfo?.email}</Text>

      <View style={styles.levelBadge}>
        <Icon name="star" size={16} color={Colors.primary} />
        <Text style={styles.levelText}>
          {readerLevel?.title || 'Novice Reader'} - Level {readerLevel?.level || 1}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: hp(2),
  },
  imageContainer: {
    position: 'relative',
    marginBottom: hp(2),
  },
  profileImage: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    borderWidth: scale(3),
    borderColor: Colors.primary,
  },
  userName: {
    fontSize: fontSizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: fontSizes.sm,
    color: Colors.gray500,
    marginBottom: hp(2),
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1),
    borderRadius: scale(20),
    gap: spacing.xs,
  },
  levelText: {
    color: Colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
});

export default ProfileHeader;
