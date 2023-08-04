import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Home from '../screens/Home';
import Search from '../screens/Search';
import Listen from '../screens/Listen';
import Saved from '../screens/Saved';
import Profile from '../screens/Profile';
import { HomeIcon, ListenIcon, LogoutIcon, ProfileIcon, SavedIcon, SearchIcon } from '../UI/Icons';
import { TouchableOpacity } from 'react-native';
import { AuthContext } from '../store/auth-context';

const Tab = createBottomTabNavigator();

const TabNavigation = () => {
  const authContext = useContext(AuthContext);
  const handleLogout = () => {
    authContext.handleLogout();
  };

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
          headerTitle: 'Learn English with Stories',
          tabBarIcon: () => <HomeIcon />,
        }}
      />
      <Tab.Screen
        name="Search"
        component={Search}
        options={{
          tabBarIcon: () => <SearchIcon />,
        }}
      />
      <Tab.Screen
        name="Listen"
        component={Listen}
        options={{
          tabBarIcon: () => <ListenIcon />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={Saved}
        options={{
          tabBarIcon: () => <SavedIcon />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: () => <ProfileIcon />,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout}>
              <LogoutIcon />
            </TouchableOpacity>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigation;
