import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ExpoSplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { vexo } from 'vexo-analytics';
import 'react-native-url-polyfill/auto';
import { Provider } from 'react-redux';
import { store } from './src/store';

// Navigation and Components
import RootNavigator from './src/navigation/RootNavigator';
import CustomToast from './src/components/CustomToast';
import AnimatedSplashScreen from './src/components/SplashScreen';

vexo(process.env.EXPO_PUBLIC_VEXO_ANALYTICS_KEY);

ExpoSplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn('Error preventing splash screen auto-hide:', err)
);

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showAnimatedSplash, setShowAnimatedSplash] = useState(true);

  const initializeApp = useCallback(async () => {
    try {
      await ExpoSplashScreen.preventAutoHideAsync();
      // Add initialization logic here
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
        await ExpoSplashScreen.hideAsync();
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
      }
    }
  }, [appIsReady]);

  const handleAnimatedSplashComplete = () => {
    setShowAnimatedSplash(false);
  };

  if (!appIsReady) {
    return null;
  }

  if (showAnimatedSplash) {
    return <AnimatedSplashScreen onAnimationComplete={handleAnimatedSplashComplete} />;
  }

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <StatusBar style="light" />
        <RootNavigator />
        <CustomToast />
      </GestureHandlerRootView>
    </Provider>
  );
};

export default App;
