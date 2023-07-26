import { NavigationContainer } from '@react-navigation/native';

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigation from './AuthNavigation';
import TabNavigation from './TabNavigation';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer
      theme={{
        colors: {
          background: '#161616',
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Auth" component={AuthNavigation} />
        <Stack.Screen name="Tab" component={TabNavigation} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
