import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext } from 'react';
import { AuthContext } from '../store/AuthContext';

export const useReadingProgress = (slug, storyData) => {
  const [progress, setProgress] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const { userInfo } = useContext(AuthContext);

  useEffect(() => {
    if (userInfo?.uid && slug) {
      loadProgress();
    }
  }, [slug, userInfo]);

  const getProgressKey = () => `progress_${userInfo?.uid}_${slug}`;
  const getScrollKey = () => `scroll_${userInfo?.uid}_${slug}`;
  const getCompletionKey = () => `completed_story_${userInfo?.uid}_${slug}`;
  const getLastReadKey = () => `lastRead_${userInfo?.uid}`;

  const loadProgress = async () => {
    if (!userInfo?.uid) return;

    try {
      const [savedProgress, savedPosition, completionStatus] = await Promise.all([
        AsyncStorage.getItem(getProgressKey()),
        AsyncStorage.getItem(getScrollKey()),
        AsyncStorage.getItem(getCompletionKey()),
      ]);

      if (completionStatus === 'true') {
        setProgress(100);
        setIsCompleted(true);
      } else if (savedProgress) {
        const parsedProgress = parseFloat(savedProgress);
        setProgress(isNaN(parsedProgress) ? 0 : parsedProgress);
      }

      if (savedPosition) {
        const parsedPosition = parseFloat(savedPosition);
        setScrollPosition(isNaN(parsedPosition) ? 0 : parsedPosition);
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  };

  const saveProgress = async (offsetY, contentHeight, viewportHeight) => {
    if (!userInfo?.uid || !slug) return;

    try {
      if (contentHeight <= 0) return progress;
      if (isCompleted) return 100;

      const scrollableHeight = contentHeight - viewportHeight;
      if (scrollableHeight <= 0) return progress;

      const newProgress = Math.min(Math.max((offsetY / scrollableHeight) * 100, 0), 100);

      // Only update if the progress has changed significantly (more than 1%)
      if (Math.abs(newProgress - progress) > 1) {
        await Promise.all([
          AsyncStorage.setItem(getProgressKey(), newProgress.toString()),
          AsyncStorage.setItem(getScrollKey(), offsetY.toString()),
        ]);

        if (storyData) {
          const lastReadData = {
            ...storyData,
            progress: newProgress,
            lastReadAt: new Date().toISOString(),
            scrollPosition: offsetY,
            isCompleted: newProgress >= 95,
          };
          await AsyncStorage.setItem(getLastReadKey(), JSON.stringify(lastReadData));
        }

        setProgress(newProgress);
        setScrollPosition(offsetY);

        if (newProgress >= 95 && !isCompleted) {
          await markAsCompleted();
        }
      }

      return newProgress;
    } catch (error) {
      console.error('Error saving reading progress:', error);
      return progress;
    }
  };

  const markAsCompleted = async () => {
    if (!userInfo?.uid) return;

    try {
      await Promise.all([
        AsyncStorage.setItem(getCompletionKey(), 'true'),
        AsyncStorage.setItem(getProgressKey(), '100'),
      ]);

      setIsCompleted(true);
      setProgress(100);

      // Update completed stories list
      const completedStoriesKey = `completedStories_${userInfo.uid}`;
      const completedStories = await AsyncStorage.getItem(completedStoriesKey);
      const completedList = completedStories ? JSON.parse(completedStories) : [];

      if (!completedList.includes(slug)) {
        completedList.push(slug);
        await AsyncStorage.setItem(completedStoriesKey, JSON.stringify(completedList));
      }
    } catch (error) {
      console.error('Error marking story as completed:', error);
    }
  };

  const resetProgress = async () => {
    if (!userInfo?.uid) return;

    try {
      await Promise.all([
        AsyncStorage.removeItem(getProgressKey()),
        AsyncStorage.removeItem(getScrollKey()),
        AsyncStorage.removeItem(getCompletionKey()),
      ]);

      setProgress(0);
      setScrollPosition(0);
      setIsCompleted(false);
    } catch (error) {
      console.error('Error resetting progress:', error);
    }
  };

  return {
    progress,
    scrollPosition,
    saveProgress,
    isCompleted,
    markAsCompleted,
    resetProgress,
    loadProgress,
  };
};
