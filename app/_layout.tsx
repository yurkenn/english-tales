import '@/theme/unistyles';
import '@/i18n'; // Initialize i18n
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import {
  CrimsonPro_400Regular,
  CrimsonPro_700Bold,
} from '@expo-google-fonts/crimson-pro';
import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold
} from '@expo-google-fonts/outfit';
import { QueryProvider } from '@/providers/QueryProvider';
import { useAuthStore } from '../store/authStore';
import { useLibraryStore } from '../store/libraryStore';
import { useProgressStore } from '../store/progressStore';
import { useThemeStore, useThemeKey, useIsDark, useThemeMode } from '../store/themeStore';
import { useDownloadStore } from '../store/downloadStore';
import { useSettingsStore } from '@/store/settingsStore';
import { secureStorage } from '../services/storage';
import { notificationService } from '@/services/notificationService';
import { adService } from '@/services/ads';
import { StatusBar } from 'expo-status-bar';
import {
  AchievementToast,
  ToastContainer,
  ErrorBoundary,
  AnimatedSplashScreen,
} from '@/components';
import { lightTheme, darkTheme, sepiaTheme } from '../theme/unistyles';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might cause some errors here, safe to ignore */
});

export default function RootLayout() {
  const { initialize, user, isLoading, initialized } = useAuthStore();
  const libraryActions = useLibraryStore((s) => s.actions);
  const progressActions = useProgressStore((s) => s.actions);
  const segments = useSegments();
  const router = useRouter();

  const { actions: settingsActions } = useSettingsStore();
  const themeActions = useThemeStore((s) => s.actions);
  const downloadActions = useDownloadStore((s) => s.actions);

  // Subscribe to theme changes for force re-render
  const mode = useThemeMode();
  const themeKey = useThemeKey();
  const isDark = useIsDark();

  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);

  // Get the correct theme object based on current mode
  const currentTheme = useMemo(() => {
    if (mode === 'sepia') return sepiaTheme;
    return isDark ? darkTheme : lightTheme;
  }, [mode, isDark]);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Load saved theme preference, settings, downloads, and setup system theme listener
  useEffect(() => {
    themeActions.loadTheme();
    settingsActions.loadSettings();
    downloadActions.loadDownloads();

    // Setup listener for system theme changes
    const cleanup = themeActions.setupSystemThemeListener();
    return cleanup;
  }, [themeActions, settingsActions, downloadActions]);

  // Load fonts
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    CrimsonPro_400Regular,
    CrimsonPro_700Bold,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  // Handle splash screen visibility
  useEffect(() => {
    if (initialized && !isLoading && fontsLoaded) {
      // App is initialized (auth, settings, fonts etc)
      setIsAppReady(true);
    }
  }, [initialized, isLoading, fontsLoaded]);

  const onSplashAnimationComplete = () => {
    setIsSplashAnimationFinished(true);
  };

  // Ref to ensure splash is hidden only once
  const isSplashHidden = useState(false);

  // Background initialization
  useEffect(() => {
    if (initialized) {
      // Initialize notifications if enabled
      if (useSettingsStore.getState().settings.notificationsEnabled) {
        notificationService.initialize();
      }

      // Initialize AdMob SDK and preload ads
      adService.initialize().catch((err) => {
        console.warn('[AdMob] Failed to initialize:', err);
      });
    }
  }, [initialized]);

  // Hide native splash once the app is initialized
  useEffect(() => {
    if (initialized && !isLoading && fontsLoaded && !isSplashHidden[0]) {
      // Small frame delay to ensure React has rendered the AnimatedSplashScreen
      requestAnimationFrame(async () => {
        try {
          await SplashScreen.hideAsync();
          isSplashHidden[1](true);
        } catch (e) {
          // ignore
        }
      });
    }
  }, [initialized, isLoading, isSplashHidden]);

  // Sync stores with auth state
  useEffect(() => {
    if (!initialized) return;

    const userId = user?.id || null;
    if (user) {
      libraryActions.setUserId(userId);
      progressActions.setUserId(userId);
    } else {
      libraryActions.setUserId(null);
      progressActions.setUserId(null);
    }
  }, [user, initialized]);

  // Protected Route Logic
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      if (!initialized || isLoading) return;

      const hasOnboarded = await secureStorage.hasCompletedOnboarding();
      const inOnboarding = segments[0] === 'onboarding';
      const inAuthGroup = segments[0] === '(auth)';
      const inProtectedGroup = segments[0] === '(tabs)';

      if (!hasOnboarded && !inOnboarding && !inAuthGroup && !user) {
        router.replace('/onboarding');
        return;
      }

      if (!user && inProtectedGroup) {
        router.replace('/login');
      } else if (user && !user.isAnonymous && inAuthGroup) {
        router.replace('/(tabs)');
      }

      setHasCheckedOnboarding(true);
    };

    checkOnboarding();
  }, [user, isLoading, initialized, segments]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryProvider>
          <BottomSheetModalProvider>
            <StatusBar style={mode === 'sepia' || isDark ? 'light' : 'dark'} />
            {!isSplashAnimationFinished && (
              <AnimatedSplashScreen onAnimationComplete={onSplashAnimationComplete} />
            )}
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: currentTheme.colors.background,
                },
              }}
            >
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="story/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="reading/[id]" options={{ presentation: 'fullScreenModal' }} />
              <Stack.Screen name="search" options={{ presentation: 'card' }} />
              <Stack.Screen name="reviews/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="achievements" options={{ presentation: 'card' }} />
              <Stack.Screen name="stories" options={{ presentation: 'card' }} />
              <Stack.Screen name="authors" options={{ presentation: 'card' }} />
              <Stack.Screen name="author/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="category/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="settings" options={{ presentation: 'card' }} />
              <Stack.Screen name="onboarding/index" options={{ headerShown: false, gestureEnabled: false }} />
            </Stack>
            <ToastContainer />
            <AchievementToast />
          </BottomSheetModalProvider>
        </QueryProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
