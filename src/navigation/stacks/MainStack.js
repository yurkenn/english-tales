// src/navigation/stacks/MainStack.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from '../TabNavigator';
import Detail from '../../screens/Detail';
import Content from '../../screens/Content';
import CategoryList from '../../screens/CategoryList';
import AllTales from '../../screens/AllTales';
import { screenOptions } from '../config/screenOptions';

const Stack = createNativeStackNavigator();

export const MainStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ headerShown: false }} />
    <Stack.Screen name="Detail" component={Detail} options={screenOptions.transparentHeader} />
    <Stack.Screen name="Content" component={Content} options={screenOptions.transparentHeader} />
    <Stack.Screen
      name="CategoryList"
      component={CategoryList}
      options={({ route }) => screenOptions.categoryHeader(route.params.category)}
    />
    <Stack.Screen name="AllTales" component={AllTales} options={screenOptions.allTalesHeader} />
  </Stack.Navigator>
);
