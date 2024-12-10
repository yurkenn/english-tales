import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from '../../screens/auth/Onboarding';
import Login from '../../screens/auth/Login';
import Signup from '../../screens/auth/Signup';
import { useOnboarding } from '../../hooks/useOnboarding';
import ResetPassword from '../../screens/auth/ResetPassword';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  const { showOnboarding } = useOnboarding();

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
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
    </Stack.Navigator>
  );
};
