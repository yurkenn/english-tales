// src/hooks/useReadingProgress.js
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useReadingProgress = (slug, storyData) => {
  const [progress, setProgress] = useState(0);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [slug]);

  const loadProgress = async () => {
    try {
      const [savedProgress, savedPosition, completionStatus] = await Promise.all([
        AsyncStorage.getItem(`progress_${slug}`),
        AsyncStorage.getItem(`scroll_${slug}`),
        AsyncStorage.getItem(`completed_story_${slug}`),
      ]);

      // If story was previously completed, set progress to 100
      if (completionStatus === 'true') {
        setProgress(100);
        setIsCompleted(true);
      } else if (savedProgress) {
        setProgress(parseFloat(savedProgress));
      }

      if (savedPosition) {
        setScrollPosition(parseFloat(savedPosition));
      }
    } catch (error) {
      console.error('Error loading reading progress:', error);
    }
  };

  const markAsCompleted = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem(`completed_story_${slug}`, 'true'),
        AsyncStorage.setItem(`progress_${slug}`, '100'),
      ]);
      setIsCompleted(true);
      setProgress(100);

      // Update completed stories list for achievements
      const completedStories = await AsyncStorage.getItem('completedStories');
      const completedList = completedStories ? JSON.parse(completedStories) : [];
      if (!completedList.includes(slug)) {
        completedList.push(slug);
        await AsyncStorage.setItem('completedStories', JSON.stringify(completedList));
      }
    } catch (error) {
      console.error('Error marking story as completed:', error);
    }
  };

  const saveProgress = async (offsetY, contentHeight, viewportHeight) => {
    try {
      if (contentHeight <= 0) return;
      if (isCompleted) return 100; // If already completed, always return 100%

      const scrollableHeight = contentHeight - viewportHeight;
      if (scrollableHeight <= 0) return;

      const newProgress = Math.min(Math.max((offsetY / scrollableHeight) * 100, 0), 100);

      // If not already completed, update progress
      if (!isCompleted) {
        await Promise.all([
          AsyncStorage.setItem(`progress_${slug}`, newProgress.toString()),
          AsyncStorage.setItem(`scroll_${slug}`, offsetY.toString()),
        ]);

        // Update last read story with progress information
        if (storyData) {
          const lastReadData = {
            ...storyData,
            progress: newProgress,
            lastReadAt: Date.now(),
            scrollPosition: offsetY,
            isCompleted: newProgress >= 95,
          };
          await AsyncStorage.setItem('lastRead', JSON.stringify(lastReadData));
        }

        setProgress(newProgress);
        setScrollPosition(offsetY);

        // If reaching completion threshold for the first time
        if (newProgress >= 95 && !isCompleted) {
          await markAsCompleted();
        }
      }

      return newProgress;
    } catch (error) {
      console.error('Error saving reading progress:', error);
    }
  };

  return {
    progress,
    scrollPosition,
    saveProgress,
    isCompleted,
    markAsCompleted,
  };
};
