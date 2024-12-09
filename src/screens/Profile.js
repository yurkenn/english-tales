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

const StatCard = ({ icon, value, label, delay = 0 }) => (
  <Animated.View entering={FadeInDown.delay(delay)} style={styles.statCard}>
    <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.statGradient}>
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={24} color={Colors.primary} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </LinearGradient>
  </Animated.View>
);

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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SCREEN_HEIGHT * 0.04,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: SCREEN_HEIGHT * 0.02,
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
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: Colors.dark900,
  },
  userName: {
    fontSize: SCREEN_HEIGHT * 0.028,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: SCREEN_HEIGHT * 0.016,
    color: Colors.gray500,
    marginBottom: SCREEN_HEIGHT * 0.02,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    paddingVertical: SCREEN_HEIGHT * 0.01,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    color: Colors.primary,
    fontSize: SCREEN_HEIGHT * 0.016,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SCREEN_WIDTH * 0.04,
    gap: SCREEN_WIDTH * 0.04,
  },
  statCard: {
    width: (SCREEN_WIDTH - SCREEN_WIDTH * 0.12) / 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statGradient: {
    padding: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
  },
  statIconContainer: {
    width: SCREEN_WIDTH * 0.12,
    height: SCREEN_WIDTH * 0.12,
    borderRadius: SCREEN_WIDTH * 0.06,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT * 0.01,
  },
  statValue: {
    fontSize: SCREEN_HEIGHT * 0.024,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: SCREEN_HEIGHT * 0.014,
    color: Colors.gray500,
  },
  settingsContainer: {
    padding: SCREEN_WIDTH * 0.04,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark500,
    padding: SCREEN_WIDTH * 0.04,
    borderRadius: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH * 0.03,
  },
  settingText: {
    fontSize: SCREEN_HEIGHT * 0.018,
    fontWeight: '500',
  },
});

export default Profile;
