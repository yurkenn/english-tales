// App.js
import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { vexo } from 'vexo-analytics';
import 'react-native-url-polyfill/auto';
import { Provider } from 'react-redux';
import { store } from './src/store';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';

// Analytics initialization
vexo(process.env.EXPO_PUBLIC_VEXO_ANALYTICS_KEY);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn('Error preventing splash screen auto-hide:', err)
);

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  const initializeApp = useCallback(async () => {
    try {
      await SplashScreen.preventAutoHideAsync();
      // Add any initialization logic here
      setAppIsReady(true);
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
      }
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RootNavigator />
        <Toast />
      </GestureHandlerRootView>
    </Provider>
  );
};

export default App;
