import { NavigationContainer } from '@react-navigation/native';
import React, { useContext, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigation from './AuthNavigation';
import TabNavigation from './TabNavigation';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import CategoryList from '../screens/CategoryList';
import Content from '../screens/Content';
import Detail from '../screens/Detail';
import AllTales from '../screens/AllTales';

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
        name="Detail"
        component={Detail}
        options={{
          headerTransparent: true,
          headerTintColor: Colors.white,
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="Content"
        component={Content}
        options={{
          headerTransparent: true,
          headerTintColor: Colors.white,
          headerTitle: '',
        }}
      />
      <Stack.Screen
        name="CategoryList"
        component={CategoryList}
        options={({ route }) => ({
          title: route.params.category,
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.dark900,
          },
        })}
      />
      <Stack.Screen
        name="AllTales"
        component={AllTales}
        options={{
          headerTintColor: Colors.white,
          headerStyle: {
            backgroundColor: Colors.dark900,
          },
          headerTitle: 'Here are all the tales',
        }}
      />
    </Stack.Navigator>
  );
};

const Navigation = () => {
  const authContext = useContext(AuthContext);

  return (
    <NavigationContainer theme={{ colors: { background: Colors.dark900 } }}>
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
