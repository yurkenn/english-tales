import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Onboarding from '../screens/auth/Onboarding';
import Login from '../screens/auth/Login';
import Signup from '../screens/auth/Signup';

const Stack = createNativeStackNavigator();

const AuthNavigation = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Check if the user has already seen the Onboarding screen
    AsyncStorage.getItem('hasSeenOnboarding').then((value) => {
      if (value === null) {
        // User has not seen the Onboarding screen before
        setShowOnboarding(true);
        AsyncStorage.setItem('hasSeenOnboarding', 'true');
      }
    });
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={showOnboarding ? 'Onboarding' : 'Login'}
    >
      <Stack.Screen name="Onboarding" component={Onboarding} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
    </Stack.Navigator>
  );
};

export default AuthNavigation;
