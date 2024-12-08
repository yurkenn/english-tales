import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import { vexo } from 'vexo-analytics';
import 'react-native-url-polyfill/auto';

// Providers
import { AuthProvider } from './src/store/AuthContext';
import BookmarkProvider from './src/store/BookmarkContext';
import { FontSizeProvider } from './src/store/FontSizeContext';

// Navigation
import RootNavigator from './src/navigation/RootNavigator';
import { UserStatsProvider } from './src/store/UserStatsContext';

// Analytics initialization
vexo(process.env.EXPO_PUBLIC_VEXO_ANALYTICS_KEY);

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn('Error preventing splash screen auto-hide:', err)
);

const AppProviders = ({ children }) => (
  <AuthProvider>
    <UserStatsProvider>
      <FontSizeProvider>
        <BookmarkProvider>{children}</BookmarkProvider>
      </FontSizeProvider>
    </UserStatsProvider>
  </AuthProvider>
);

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepareApp() {
      try {
        await SplashScreen.preventAutoHideAsync();
        // Add initialization logic here
        setAppIsReady(true);
      } catch (error) {
        console.error('Error preparing app:', error);
      } finally {
        try {
          await SplashScreen.hideAsync();
        } catch (error) {
          console.warn('Error hiding splash screen:', error);
        }
      }
    }

    prepareApp();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <AppProviders>
        <RootNavigator />
      </AppProviders>
      <Toast />
    </GestureHandlerRootView>
  );
};

export default App;
