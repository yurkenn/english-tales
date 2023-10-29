import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import { useFontSize } from '../store/FontSizeContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebaseConfig';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);

  const authContext = useContext(AuthContext);

  const { changeFontSize, fontSize } = useFontSize();

  const handleLogout = () => {
    authContext.handleLogout();
  };

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson) {
          // If cached data is available, set it to the state
          const user = JSON.parse(userJson);
          setUserData(user);
        }

        // Fetch data from Firestore and update the cache
        const userRef = doc(firestore, 'users', authContext.userInfo.uid);
        onSnapshot(userRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const user = docSnapshot.data();
            console.log('user', user);
            setUserData(user);
            // Update the AsyncStorage cache
            AsyncStorage.setItem('@user', JSON.stringify(user));
          }
        });
      } catch (error) {
        console.error('Error retrieving user data:', error);
      }
    };

    getUserData();
  }, [authContext.userInfo.uid]);

  console.log('userData', userData);

  return (
    <View style={styles.container}>
      <View style={styles.profileContainer}>
        {userData?.photoURL ? null : (
          <Image
            source={require('../../assets/images/blank-profile.png')}
            style={styles.profileImage}
          />
        )}
        <Text style={styles.displayName}>
          {userData?.displayName ? null : `${userData?.firstName} ${userData?.lastName}`}
        </Text>
        <Text style={styles.email}>{userData?.email}</Text>
        <View style={styles.fontSizeContainer}>
          <Text style={styles.fontSizeText}>Change Fontsize : {fontSize}</Text>
          <View style={styles.settingsContainer}>
            <TouchableOpacity
              onPress={() => changeFontSize(Number(fontSize + 1))} // Increase font size
              style={styles.plusButton}
            >
              <Text style={styles.plusText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => changeFontSize(Number(fontSize - 1))} // Decrease font size
              style={styles.minusButton}
            >
              <Text style={styles.minusText}>-</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={handleLogout}>
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 50,
  },
  profileContainer: {
    flex: 1,
    alignItems: 'center',
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.white,
  },
  email: {
    fontSize: 16,
    color: 'gray',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.dark500,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    padding: 10,
    borderRadius: 10,
    width: '80%',
  },
  fontSizeText: {
    fontSize: 20,
    color: Colors.white,
  },
  settingsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  plusButton: {
    backgroundColor: Colors.dark900,
    borderRadius: 6,
    width: 30,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  plusText: {
    fontSize: 24,
    color: Colors.white,
  },
  minusButton: {
    backgroundColor: Colors.dark900,
    borderRadius: 6,
    width: 30,
    height: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minusText: {
    fontSize: 24,
    color: Colors.white,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: 20,
    width: '100%',
  },
  button: {
    backgroundColor: Colors.dark500,
    borderRadius: 6,
    height: 48,
    justifyContent: 'center',
    marginVertical: 10,
    marginHorizontal: 10,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    textAlign: 'center',
  },
});
