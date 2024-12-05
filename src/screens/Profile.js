import React, { useContext, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import Icon from '../components/Icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

const StatisticCard = ({ icon, value, label }) => (
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>
      <Icon name={icon} size={24} color={Colors.primary} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const SettingItem = ({ icon, label, value, onPress, isLast }) => (
  <TouchableOpacity style={[styles.settingItem, !isLast && styles.settingBorder]} onPress={onPress}>
    <View style={styles.settingLeft}>
      <Icon name={icon} size={20} color={Colors.white} />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <View style={styles.settingRight}>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      <Icon name="chevron-forward" size={20} color={Colors.gray} />
    </View>
  </TouchableOpacity>
);

const Profile = () => {
  const { userInfo, updateUserInfo, handleLogout } = useContext(AuthContext);
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const statistics = [
    { icon: 'book', value: '24', label: 'Stories Read' },
    { icon: 'time', value: '12.5h', label: 'Time Spent' },
    { icon: 'star', value: '85%', label: 'Completion' },
    { icon: 'trophy', value: '8', label: 'Achievements' },
  ];

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

  const handleLogoutPress = async () => {
    try {
      await handleLogout();
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to logout',
      });
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={pickImage} disabled={isLoading}>
          <View style={styles.imageContainer}>
            <Image
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
          <Text style={styles.levelText}>Level 5 Reader</Text>
        </View>
      </View>

      {/* Statistics */}
      <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          {statistics.map((stat, index) => (
            <StatisticCard key={index} icon={stat.icon} value={stat.value} label={stat.label} />
          ))}
        </View>
      </Animated.View>

      {/* Settings */}
      <Animated.View entering={FadeInDown.delay(400)} style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <SettingItem icon="notifications" label="Notifications" onPress={() => {}} />
          <SettingItem icon="moon" label="Dark Mode" value="On" onPress={() => {}} />
          <SettingItem icon="text" label="Font Size" value="Medium" onPress={() => {}} />
          <SettingItem icon="globe" label="Language" value="English" onPress={() => {}} />
          <SettingItem icon="help-circle" label="Help & Support" onPress={() => {}} />
          <SettingItem icon="log-out" label="Logout" onPress={handleLogoutPress} isLast />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark900,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: Colors.dark500,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 15,
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.gray,
    marginBottom: 15,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark900 + '80',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  levelText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 15,
  },
  statsContainer: {
    padding: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    width: (SCREEN_WIDTH - 55) / 2,
    backgroundColor: Colors.dark500,
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: Colors.dark900 + '80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.gray,
  },
  settingsContainer: {
    padding: 20,
  },
  settingsCard: {
    backgroundColor: Colors.dark500,
    borderRadius: 15,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark900,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.white,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: Colors.gray,
  },
});

export default Profile;
