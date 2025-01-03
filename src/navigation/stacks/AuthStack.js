// src/navigation/stacks/AuthStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Onboarding from '../../screens/auth/Onboarding';
import Login from '../../screens/auth/Login';
import Signup from '../../screens/auth/Signup';
import useOnboarding from '../../hooks/useOnboarding';
import ResetPassword from '../../screens/auth/ResetPassword';
import PrivacyPolicy from '../../screens/PrivacyPolicy';
import { Colors } from '../../constants/colors';
import LoadingAnimation from '../../components/Animations/LoadingAnimation';

const Stack = createNativeStackNavigator();

export const AuthStack = () => {
  const { showOnboarding, loading } = useOnboarding();

  if (loading) {
    return <LoadingAnimation />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={showOnboarding ? 'Onboarding' : 'Login'}
    >
      {showOnboarding && <Stack.Screen name="Onboarding" component={Onboarding} />}
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicy}
        options={{
          title: 'Privacy Policy',
          headerShown: true,
          headerTintColor: Colors.white,
          headerStyle: { backgroundColor: Colors.dark900 },
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthStack;
