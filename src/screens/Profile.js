// src/screens/Profile.js
import React, { useContext, useState } from 'react';
import { ScrollView, View, StyleSheet, Dimensions, Text } from 'react-native';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';

// Components
import { ProfileHeader } from '../components/Profile/ProfileHeader';
import { StatisticCard } from '../components/Profile/StatisticCard';
import { SettingItem } from '../components/Profile/SettingItem';

// Hooks
import { useProfileSettings } from '../hooks/useProfileSettings';

const Profile = () => {
  const { userInfo, updateUserInfo, handleLogout } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const { statistics } = useProfileSettings();

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
      <ProfileHeader userInfo={userInfo} onImagePress={pickImage} isLoading={isLoading} />

      <Animated.View entering={FadeInDown.delay(200)} style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Your Progress</Text>
        <View style={styles.statsGrid}>
          {statistics.map((stat, index) => (
            <StatisticCard key={index} {...stat} />
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.settingsCard}>
          <SettingItem icon="notifications" label="Notifications" onPress={() => {}} />
          <SettingItem icon="text" label="Font Size" value="Medium" onPress={() => {}} />
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
  settingsContainer: {
    padding: 20,
  },
  settingsCard: {
    backgroundColor: Colors.dark500,
    borderRadius: 15,
    overflow: 'hidden',
  },
});

export default Profile;
