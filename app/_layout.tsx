import '@/theme/unistyles';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useUnistyles } from 'react-native-unistyles';
import { useEffect } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  const { theme } = useUnistyles();
  const { initialize, user, isLoading, initialized } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, [initialize]);

  // Protected Route Logic
  useEffect(() => {
    if (!initialized || isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';

    if (!user && inProtectedGroup) {
      // Redirect to login if trying to access protected route without user
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect to home if user is logged in but tries to access auth screens
      router.replace('/(tabs)');
    }
  }, [user, isLoading, initialized, segments]);

  return (
    <QueryProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: theme.colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="story/[id]"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="reading/[id]"
          options={{
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="reviews/[id]"
          options={{
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="onboarding/index"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </QueryProvider>
  );
}
