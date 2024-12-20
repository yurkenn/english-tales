// src/hooks/useOnboarding.js
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@hasCompletedOnboarding';

const useOnboarding = () => {
  const [showOnboarding, setShowOnboarding] = useState(false); // Default to false to prevent flash
  const [loading, setLoading] = useState(true);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true);
      const hasCompletedOnboarding = await AsyncStorage.getItem(ONBOARDING_KEY);
      setShowOnboarding(hasCompletedOnboarding === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false); // Fail safe - don't show onboarding if there's an error
    } finally {
      setLoading(false);
    }
  }, []);

  const markOnboardingComplete = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
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
