import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { useDispatch, useSelector } from 'react-redux';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { wp, hp, scale, moderateScale, fontSizes, spacing, layout } from '../utils/dimensions';
import { selectUser, selectFormattedStats, selectUserStatsLoading } from '../store/selectors';
import { loadUserStats } from '../store/slices/userStatsSlice';
import { logoutUser } from '../store/slices/authSlice';
import { AchievementSection } from '../components/Achievement/AchievementSection';
import StatCard from '../components/Profile/StatCard';
import SettingItem from '../components/Profile/SettingItem';
import ProfileHeader from '../components/Profile/ProfileHeader';

const Profile = ({ navigation }) => {
  const dispatch = useDispatch();
  const userInfo = useSelector(selectUser);
  const formattedStats = useSelector(selectFormattedStats);
  const loading = useSelector(selectUserStatsLoading);

  useEffect(() => {
    if (userInfo?.uid) {
      dispatch(loadUserStats(userInfo.uid));
    }
  }, [userInfo]);

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#2A2D3A', '#1F222E']} style={styles.header}>
        <ProfileHeader
          userInfo={userInfo}
          readerLevel={formattedStats.readerLevel}
          isLoading={loading}
        />
      </LinearGradient>

      <View style={styles.statsGrid}>
        <StatCard icon="book" value={formattedStats.storiesRead} label="Tales Read" delay={200} />
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
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <SettingItem
            icon="shield-checkmark"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
          />
          <SettingItem icon="log-out" label="Logout" onPress={handleLogout} isLast />
        </View>
      </View>
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
  settingsContainer: {
    padding: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: spacing.md,
  },
  settingsCard: {
    marginTop: spacing.sm,
  },
});

export default Profile;
