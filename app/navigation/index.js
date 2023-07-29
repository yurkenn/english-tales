import { NavigationContainer } from '@react-navigation/native';

import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigation from './AuthNavigation';
import TabNavigation from './TabNavigation';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  const authContext = useContext(AuthContext);
  return (
    <NavigationContainer
      theme={{
        colors: {
          background: Colors.primaryBackground,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {authContext.user ? (
          <Stack.Screen name="Tab" component={TabNavigation} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigation} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
