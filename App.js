import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { hideAsync } from 'expo-splash-screen';
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

  useEffect(() => {
    async function prepare() {
      try {
        // Hide native splash immediately
        await hideAsync();
        setAppIsReady(true);
      } catch (e) {
        console.warn(e);
      }
    }
    prepare();
  }, []);

  const handleAnimatedSplashComplete = () => {
    setShowAnimatedSplash(false);
  };

  if (!appIsReady) return null;
  if (showAnimatedSplash)
    return <AnimatedSplashScreen onAnimationComplete={handleAnimatedSplashComplete} />;

  return (
    <Provider store={store}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <StatusBar style="light" />
        <RootNavigator />
        <CustomToast />
      </GestureHandlerRootView>
    </Provider>
  );
};

export default App;
