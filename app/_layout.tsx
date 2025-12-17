import '@/theme/unistyles';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryProvider } from '@/providers/QueryProvider';
import { useAuthStore } from '@/store/authStore';
import { useLibraryStore } from '@/store/libraryStore';
import { useProgressStore } from '@/store/progressStore';
import { useThemeStore, useThemeKey, useIsDark } from '@/store/themeStore';
import { useDownloadStore } from '@/store/downloadStore';
import { secureStorage } from '@/services/storage';
import { AchievementToast, ToastContainer, ErrorBoundary } from '@/components';
import { lightTheme, darkTheme } from '@/theme/unistyles';

export default function RootLayout() {
  const { initialize, user, isLoading, initialized } = useAuthStore();
  const libraryActions = useLibraryStore((s) => s.actions);
  const progressActions = useProgressStore((s) => s.actions);
  const segments = useSegments();
  const router = useRouter();

  const themeActions = useThemeStore((s) => s.actions);
  const downloadActions = useDownloadStore((s) => s.actions);

  // Subscribe to theme changes for force re-render
  const themeKey = useThemeKey();
  const isDark = useIsDark();

  // Get the correct theme object based on isDark state
  const currentTheme = isDark ? darkTheme : lightTheme;

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Load saved theme preference and downloads, and setup system theme listener
  useEffect(() => {
    themeActions.loadTheme();
    downloadActions.loadDownloads();

    // Setup listener for system theme changes
    const cleanup = themeActions.setupSystemThemeListener();
    return cleanup;
  }, [themeActions, downloadActions]);

  // Sync stores with auth state
  useEffect(() => {
    if (!initialized) return;

    const userId = user?.id || null;
    if (user && !user.isAnonymous) {
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

      if (!hasOnboarded && !inOnboarding && !user) {
        router.replace('/onboarding');
        return;
      }

      if (!user && inProtectedGroup) {
        router.replace('/login');
      } else if (user && inAuthGroup) {
        router.replace('/(tabs)');
      }

      setHasCheckedOnboarding(true);
    };

    checkOnboarding();
  }, [user, isLoading, initialized, segments]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }} key={`root-${themeKey}`}>
        <QueryProvider>
          <BottomSheetModalProvider>
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
