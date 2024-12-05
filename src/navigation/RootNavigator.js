import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../store/AuthContext';
import { AuthStack } from './stacks/AuthStack';
import { MainStack } from './stacks/MainStack';
import NavigationErrorBoundary from './NavigationErrorBoundary';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { userInfo } = useContext(AuthContext);

  return (
    <NavigationErrorBoundary>
      <NavigationContainer theme={{ colors: { background: Colors.dark900 } }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {userInfo ? (
            <Stack.Screen name="Main" component={MainStack} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationErrorBoundary>
  );
};

export default RootNavigator;
