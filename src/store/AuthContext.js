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
import { Alert } from 'react-native';

const AuthContext = createContext({
  userInfo: null,
  loading: false,
  handleLogin: () => {},
  handleSignup: () => {},
  handleLogout: () => {},
  promptAsync: () => {},
  updateUserInfo: () => {},
});

const AuthProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userJSON = await AsyncStorage.getItem('@user');
        const userDATA = userJSON ? JSON.parse(userJSON) : null;
        if (userDATA) {
          setUserInfo({ ...user, ...userDATA });
        } else {
          setUserInfo(user);
        }
      } else {
        setUserInfo(null);
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
    } catch (error) {
      throw error;
    }
  };

  const createUser = async (values) => {
    try {
      const signup = await createUserWithEmailAndPassword(auth, values.email, values.password);
      if (signup.user) {
        const { firstName, lastName, email } = values;
        const userObj = { firstName, lastName, email, uid: signup.user.uid };
        await AsyncStorage.setItem('@user', JSON.stringify(userObj));
        setUserInfo(userObj);
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
              await signOut(auth);
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
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userJson = await AsyncStorage.getItem('@user');
        if (userJson != null) {
          setUserInfo(JSON.parse(userJson));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };

    loadUserData();
  }, []);

  const updateUserInfo = async (newInfo) => {
    setUserInfo(newInfo);
    await AsyncStorage.setItem('@user', JSON.stringify(newInfo));
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
      updateUserInfo,
    }),
    [userInfo, loading, request, response]
  );

  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
};

export { AuthContext, AuthProvider };
