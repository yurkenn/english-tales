import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Search from '../screens/Search';
import Saved from '../screens/Saved';
import Profile from '../screens/Profile';
import { TouchableOpacity } from 'react-native';
import { AuthContext } from '../store/AuthContext';
import { Colors } from '../constants/colors';
import Icon from '../components/Icons';

const Tab = createBottomTabNavigator();

const TabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark500,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleAlign: 'center',
        headerTitleStyle: {
          color: Colors.white,
          fontSize: 16,
          fontWeight: '500',
          lineHeight: 20,
          textAlign: 'center',
        },
        tabBarStyle: {
          backgroundColor: Colors.dark500,
          height: 72,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          color: Colors.white,
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
          headerTitle: 'Learn English with Stories',
          tabBarIcon: () => <Icon name={'home'} size={23} color={'white'} />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          tabBarIcon: () => <Icon name={'search'} size={23} color={'white'} />,
        }}
      />

      <Tab.Screen
        name="Library"
        component={Saved}
        options={{
          tabBarIcon: () => <Icon name={'bookmark'} size={23} color={'white'} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: () => <Icon name={'person'} size={23} color={'white'} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;
