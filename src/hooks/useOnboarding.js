import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      if (value === null) {
        setShowOnboarding(true);
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  return { showOnboarding };
};
