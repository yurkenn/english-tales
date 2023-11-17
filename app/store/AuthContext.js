import { createContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import * as Google from 'expo-auth-session/providers/google';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import { Alert } from 'react-native';

const AuthContext = createContext({
  userInfo: null,
  loading: false,
  handleLogin: () => {},
  handleSignup: () => {},
  handleLogout: () => {},
  promptAsync: () => {},
  updateUserProfileImage: () => {},
});

const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: Config.IOS_CLIENT_ID,
    androidClientId: Config.ANDROID_CLIENT_ID,
  });

  const checkLocalUser = async () => {
    try {
      setLoading(true);
      const userJSON = await AsyncStorage.getItem('@user');
      const userDATA = userJSON ? JSON.parse(userJSON) : null;
      console.log('LOCAL STORAGE: USER DATA =>', userDATA);
      setUserInfo(userDATA);
    } catch (error) {
      console.log('Error getting user from local storage', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLocalUser();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log(JSON.stringify(user, null, 2));
        setUserInfo(user);
        await AsyncStorage.setItem('@user', JSON.stringify(user));
      } else {
        setUserInfo(null);
        console.log('User is not authenticated!');
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const handleLogin = async (values) => {
    try {
      const login = await signInWithEmailAndPassword(auth, values.email, values.password);
      console.log('User Logged In!', login);
    } catch (error) {
      console.log('Login Error', error);
      throw error;
    }
  };

  const createUser = async (values) => {
    try {
      const signup = await createUserWithEmailAndPassword(auth, values.email, values.password);

      if (signup.user) {
        const { firstName, lastName, email } = values;
        const userUid = signup.user.uid;
        const userData = {
          firstName,
          lastName,
          email,
          uid: userUid,
        };
        await AsyncStorage.setItem('@user', JSON.stringify(userData));

        console.log('User data saved to Firestore!', { firstName, lastName, email, uid: userUid });
      }
    } catch (error) {
      console.log('Signup Error', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to logout?',
      [
        // The "No" button
        // Does nothing but dismiss the dialog when pressed
        {
          text: 'No',
          onPress: () => console.log('Cancel Logout'),
          style: 'cancel',
        },
        // The "Yes" button
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await signOut(auth); // Assuming signOut is from your auth system
              console.log('User Logged Out!');
              await AsyncStorage.removeItem('@user');
              // Additional logic after logout if needed
            } catch (error) {
              console.log('Logout Error', error);
              Alert.alert(
                'Logout Error',
                'Could not log out at this time. Please try again later.'
              );
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const updateUserProfileImage = async (newImageUri) => {
    const updatedUserData = { ...userInfo, photoURL: newImageUri };
    setUserInfo(updatedUserData);
    await AsyncStorage.setItem('@user', JSON.stringify(updatedUserData));
    // You might also want to update the profile picture in your Firebase user profile if applicable
  };

  const values = useMemo(
    () => ({
      userInfo,
      loading,
      handleLogin,
      createUser,
      handleLogout,
      request,
      response,
      promptAsync,
      updateUserProfileImage,
    }),
    [userInfo, loading, request, response]
  );

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
