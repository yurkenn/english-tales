import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Search from '../screens/Search';
import Listen from '../screens/Listen';
import Saved from '../screens/Saved';
import Profile from '../screens/Profile';
import { HomeButton, ListenButton, ProfileButton, SavedButton, SearchButton } from '../UI/TabIcons';

const Tab = createBottomTabNavigator();

const TabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#282828',
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: '#fff',
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#282828',
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          color: '#fff',
          fontSize: 12,
          fontWeight: '500',
          lineHeight: 14,
          textAlign: 'center',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: () => <HomeButton />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          tabBarIcon: () => <SearchButton />,
        }}
      />
      <Tab.Screen
        name="Listen"
        component={Listen}
        options={{
          tabBarIcon: () => <ListenButton />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={Saved}
        options={{
          tabBarIcon: () => <SavedButton />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: () => <ProfileButton />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;
