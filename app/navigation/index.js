import { NavigationContainer } from '@react-navigation/native';
import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigation from './AuthNavigation';
import TabNavigation from './TabNavigation';
import Content from '../screens/Content';
import { AuthContext } from '../store/auth-context';
import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Tab"
        component={TabNavigation}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Content"
        component={Content}
        options={({ route }) => ({
          //title: route.params.data.title,
          headerTitle: '',
          headerTransparent: true,
          headerBackTitleVisible: false,
          headerTintColor: '#fff',
        })}
      />
    </Stack.Navigator>
  );
};

const Navigation = () => {
  const authContext = useContext(AuthContext);

  return (
    <NavigationContainer theme={{ colors: { background: Colors.primaryBackground } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authContext.userInfo ? (
          <Stack.Screen name="Home" component={HomeStack} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigation} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
