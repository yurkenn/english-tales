import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { tabScreens } from './config/tabScreens';
import { tabOptions } from './config/tabOptions';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      {tabScreens.map((screen) => (
        <Tab.Screen
          key={screen.name}
          name={screen.name}
          component={screen.component}
          options={screen.options}
        />
      ))}
    </Tab.Navigator>
  );
};

export default TabNavigator;
