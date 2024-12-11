import { createContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
  updateProfile,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import Toast from 'react-native-toast-message';

export const AuthContext = createContext({
  userInfo: null,
  loading: false,
  handleLogin: () => {},
  createUser: () => {},
  handleLogout: () => {},
  promptAsync: () => {},
  updateUserInfo: () => {},
});

export const AuthProvider = ({ children }) => {
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
        const userData = userJSON ? JSON.parse(userJSON) : null;
        if (userData) {
          setUserInfo({ ...user, ...userData });
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
      setLoading(true);
      const login = await signInWithEmailAndPassword(auth, values.email, values.password);
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
      });
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      }
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (values) => {
    try {
      setLoading(true);
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      // Update the user's profile with display name
      await updateProfile(userCredential.user, {
        displayName: values.displayName.trim(),
      });

      // Update local state with the complete user info
      const updatedUser = {
        ...userCredential.user,
        displayName: values.displayName.trim(),
      };

      // Store user data in AsyncStorage
      await AsyncStorage.setItem('@user', JSON.stringify(updatedUser));
      setUserInfo(updatedUser);

      Toast.show({
        type: 'success',
        text1: 'Account created successfully!',
        text2: `Welcome, ${values.displayName}!`,
      });

      return userCredential;
    } catch (error) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      }
      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: errorMessage,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('@user');
      setUserInfo(null);
      Toast.show({
        type: 'success',
        text1: 'Logged out successfully',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Logout Failed',
        text2: 'Could not log out at this time. Please try again.',
      });
    }
  };

  const updateUserInfo = async (newInfo) => {
    try {
      // Update Firebase profile if display name is changed
      if (newInfo.displayName !== userInfo.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: newInfo.displayName,
        });
      }

      // Update local storage and state
      await AsyncStorage.setItem('@user', JSON.stringify(newInfo));
      setUserInfo(newInfo);

      Toast.show({
        type: 'success',
        text1: 'Profile updated successfully!',
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: 'Failed to update profile. Please try again.',
      });
    }
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
