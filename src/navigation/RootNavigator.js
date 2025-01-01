import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { AuthStack } from './stacks/AuthStack';
import { MainStack } from './stacks/MainStack';
import { Colors } from '../constants/colors';
import { checkAuthState } from '../store/slices/authSlice';
import LoadingScreen from '../components/LoadingScreen';
import useOnboarding from '../hooks/useOnboarding';
import OnboardingScreen from '../screens/auth/Onboarding';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);
  const { showOnboarding, loading: onboardingLoading } = useOnboarding();

  useEffect(() => {
    dispatch(checkAuthState());
  }, [dispatch]);

  if (loading || onboardingLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer theme={{ colors: { background: Colors.dark900 } }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={MainStack} />
        ) : (
          <>
            {showOnboarding && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Auth" component={AuthStack} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
