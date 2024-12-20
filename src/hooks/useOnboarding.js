import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [loading, setLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true);
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(value === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  }, []);

  useEffect(() => {
    checkOnboardingStatus();
  }, [checkOnboardingStatus]);

  return {
    showOnboarding,
    loading,
    markOnboardingComplete,
  };
};

export default useOnboarding;
