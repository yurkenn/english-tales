import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../Icons';
import { Colors } from '../../constants/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
    paddingVertical: SCREEN_HEIGHT * 0.03,
    paddingHorizontal: SCREEN_WIDTH * 0.05,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SCREEN_HEIGHT * 0.015,
  },
  profileImage: {
    width: SCREEN_WIDTH * 0.25,
    height: SCREEN_WIDTH * 0.25,
    borderRadius: SCREEN_WIDTH * 0.125,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    padding: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.dark900,
  },
  userName: {
    fontSize: SCREEN_HEIGHT * 0.03,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: SCREEN_HEIGHT * 0.005,
  },
  userEmail: {
    fontSize: SCREEN_HEIGHT * 0.016,
    color: Colors.gray300,
    marginBottom: SCREEN_HEIGHT * 0.015,
  },
  editProfileButton: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_HEIGHT * 0.008,
    borderRadius: 20,
  },
  editProfileText: {
    color: Colors.primary,
    fontSize: SCREEN_HEIGHT * 0.016,
    fontWeight: '600',
  },
});
