import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { AuthContext } from '../store/AuthContext';
import { useUserStats } from '../store/UserStatsContext';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from '../components/Icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { AchievementSection } from '../components/Achievement/AchievementSection';
import StatCard from '../components/Profile/StatCard';
import { wp, hp, scale, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';

const Profile = () => {
  const { userInfo, updateUserInfo, handleLogout } = useContext(AuthContext);
  const { formattedStats } = useUserStats();
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        await updateUserInfo({ ...userInfo, photoURL: result.assets[0].uri });
        Toast.show({
          type: 'success',
          text1: 'Profile photo updated successfully',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to update profile photo',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.header}>
        <TouchableOpacity onPress={pickImage} disabled={isLoading}>
          <View style={styles.imageContainer}>
            <Animated.Image
              source={
                userInfo.photoURL
                  ? { uri: userInfo.photoURL }
                  : require('../../assets/images/blank-profile.png')
              }
              style={styles.profileImage}
            />
            <View style={styles.editBadge}>
              <Icon name="camera" size={16} color={Colors.white} />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={styles.userName}>{userInfo.displayName || 'Reader'}</Text>
        <Text style={styles.userEmail}>{userInfo.email}</Text>

        <View style={styles.levelBadge}>
          <Icon name="star" size={16} color={Colors.primary} />
          <Text style={styles.levelText}>
            {formattedStats.readerLevel.title} - Level {formattedStats.readerLevel.level}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard icon="book" value={formattedStats.storiesRead} label="Stories Read" delay={200} />
        <StatCard icon="time" value={formattedStats.timeSpent} label="Time Reading" delay={300} />
        <StatCard
          icon="flame"
          value={formattedStats.currentStreak}
          label="Day Streak"
          delay={400}
        />
        <StatCard
          icon="trophy"
          value={`${formattedStats.achievementProgress}%`}
          label="Achievements"
          delay={500}
        />
      </View>

      <AchievementSection achievements={formattedStats.achievements} />

      <View style={styles.settingsContainer}>
        <TouchableOpacity style={styles.settingItem} onPress={() => handleLogout()}>
          <View style={styles.settingLeft}>
            <Icon name="log-out" size={20} color={Colors.error} />
            <Text style={[styles.settingText, { color: Colors.error }]}>Logout</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <Toast />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  header: {
    alignItems: 'center',
    paddingVertical: hp(4),
    borderBottomLeftRadius: scale(30),
    borderBottomRightRadius: scale(30),
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
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: spacing.sm,
    borderRadius: layout.borderRadius,
    borderWidth: scale(3),
    borderColor: Colors.dark900,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.md,
    gap: wp(4),
  },
  settingsContainer: {
    padding: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark500,
    padding: spacing.md,
    borderRadius: layout.borderRadius,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
  },
  settingText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
});

export default Profile;
