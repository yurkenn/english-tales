import React, { useEffect } from 'react';
import Navigation from './src/navigation';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/store/AuthContext';
import BookmarkProvider from './src/store/BookmarkContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import { FontSizeProvider } from './src/store/FontSizeContext';
import Toast from 'react-native-toast-message';
import * as SplashScreen from 'expo-splash-screen';
import { vexo } from 'vexo-analytics';
vexo(process.env.EXPO_PUBLIC_VEXO_ANALYTICS_KEY);

SplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn(`SplashScreen.preventAutoHideAsync() errored:`, err)
);

const App = () => {
  useEffect(() => {
    async function prepare() {
      try {
        // Keep the splash screen visible while we fetch resources
        await SplashScreen.preventAutoHideAsync();
        // Load fonts, images, and other resources here
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen
        SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);
  return (
    <>
      <StatusBar style="auto" />
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <FontSizeProvider>
            <BookmarkProvider>
              <Navigation />
            </BookmarkProvider>
          </FontSizeProvider>
        </AuthProvider>
      </GestureHandlerRootView>
      <Toast />
    </>
  );
};

export default App;
