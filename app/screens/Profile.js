import React, { useContext, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import { useFontSize } from '../store/FontSizeContext';
import LoadingAnimation from '../components/Animations/LoadingAnimation';
import CustomButton from '../components/CustomButton';
import FontSizeSettings from '../components/Profile/FontSizeSettings';
import ProfileDetails from '../components/Profile/ProfileDetails';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { handleLogout } = useContext(AuthContext);
  const { changeFontSize, fontSize } = useFontSize();

  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);
      try {
        const user = await retrieveUserData();
        setUserData(user);
      } catch (error) {
        console.error('Error retrieving user data from AsyncStorage:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();
  }, []);

  const retrieveUserData = async () => {
    const userJson = await AsyncStorage.getItem('@user');
    return userJson != null ? JSON.parse(userJson) : null;
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setUserData(null); // Update the state to reflect the cleared data
      alert('All data cleared'); // Inform the user
    } catch (error) {
      console.error('Error clearing AsyncStorage data:', error);
    }
  };

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <View style={styles.container}>
      <ProfileDetails userData={userData} />
      <FontSizeSettings changeFontSize={changeFontSize} fontSize={fontSize} />
      <CustomButton
        title="Clear Data"
        style={[styles.button, styles.clearDataButton]}
        onPress={clearAllData}
        textStyle={styles.fontButtonText}
      />
      <CustomButton
        title="Logout"
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
        textStyle={styles.fontButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.dark900,
  },
  fontButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  clearDataButton: {
    backgroundColor: Colors.red,
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: Colors.dark500,
  },
});

export default ProfileScreen;
