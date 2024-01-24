import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { AuthContext } from '../../../store/AuthContext';
import { Colors } from '../../../constants/colors';
import LoadingAnimation from '../../Animations/LoadingAnimation';
import CustomButton from '../../CustomButton';
import ProfileDetails from './ProfileDetails';
import Statistics from './Statistics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const { userInfo, updateUserInfo, handleLogout } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  // Function to update user stats
  const handleUserStats = async () => {
    if (userInfo) {
      const updatedUser = {
        ...userInfo,
        stats: {
          ...userInfo.stats,
          totalSessions: (userInfo.stats?.totalSessions || 0) + 1,
        },
      };
      await updateUserInfo(updatedUser); // Updating using context
    }
    setLoading(false);
  };

  useEffect(() => {
    handleUserStats();
  }, []);

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
              updateUserInfo(null);
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data.');
              console.error('Error clearing user data:', error);
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
      <ProfileDetails userData={userInfo} />
      <Statistics userData={userInfo} />
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

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: windowWidth * 0.03,
    paddingVertical: windowHeight * 0.02,
    backgroundColor: Colors.dark900,
  },
  clearDataButton: {
    backgroundColor: Colors.dark500,
    marginBottom: windowHeight * 0.02,
  },
  logoutButton: {
    backgroundColor: Colors.dark500,
  },
  button: {
    padding: windowWidth * 0.03,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontButtonText: {
    fontSize: windowWidth * 0.04,
    fontWeight: '500',
    color: Colors.white,
  },
});
