import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../../store/AuthContext';
import { Colors } from '../../../constants/colors';
import LoadingAnimation from '../../Animations/LoadingAnimation';
import CustomButton from '../../CustomButton';
import FontSizeSettings from '../FontSizeSettings';
import ProfileDetails from './ProfileDetails';
import Statistics from './Statistics';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { handleLogout } = useContext(AuthContext);

  const loadUserData = async () => {
    const userJson = await AsyncStorage.getItem('@user');
    return userJson != null ? JSON.parse(userJson) : null;
  };

  const handleUserStats = useCallback(async () => {
    const user = await loadUserData();
    if (user) {
      const updatedUser = {
        ...user,
        stats: {
          ...user.stats,
          totalSessions: (user.stats?.totalSessions || 0) + 1,
        },
      };
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUserData(updatedUser);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    handleUserStats();
  }, [handleUserStats]);

  const clearAllData = async () => {
    Alert.alert(
      'Clear All Data',
      'Are you sure you want to clear all data?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              setUserData(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
              console.error('Error clearing AsyncStorage data:', error);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <View style={styles.container}>
      <ProfileDetails userData={userData} />
      <Statistics userData={userData} />
      <CustomButton
        title="Clear History"
        onPress={clearAllData}
        textStyle={[styles.fontButtonText && { color: Colors.red }]}
        style={styles.clearDataButton}
      />
      <CustomButton
        title="Logout"
        onPress={handleLogout}
        textStyle={styles.fontButtonText}
        style={styles.logoutButton}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.dark900,
  },
  clearDataButton: {
    backgroundColor: Colors.dark500,
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: Colors.dark500,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.white,
  },
});
