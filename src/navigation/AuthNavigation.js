import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/auth/Login';
import Signup from '../screens/auth/Signup';
import Onboarding from '../screens/auth/Onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Stack = createNativeStackNavigator();

const AuthNavigation = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  useEffect(() => {
    const checkIfOnboardingShown = async () => {
      try {
        const value = await AsyncStorage.getItem('onboardingShown');
        if (value !== null) {
          setShowOnboarding(false);
        } else {
          await AsyncStorage.setItem('onboardingShown', 'true');
        }
      } catch (error) {
        console.error('Error retrieving data from AsyncStorage: ', error);
      }
    };

    checkIfOnboardingShown();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {showOnboarding ? (
        <Stack.Screen name="Onboarding" component={Onboarding} />
      ) : (
        <>
          <Stack.Screen name="Login" component={Login} />
          <Stack.Screen name="Signup" component={Signup} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AuthNavigation;

const styles = StyleSheet.create({});
