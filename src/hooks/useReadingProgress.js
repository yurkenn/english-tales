// src/hooks/useReadingProgress.js
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

  const loadProgress = async () => {
    if (!userInfo?.uid) return;

    try {
      const [savedProgress, savedPosition, completionStatus] = await Promise.all([
        AsyncStorage.getItem(`progress_${userInfo.uid}_${slug}`),
        AsyncStorage.getItem(`scroll_${userInfo.uid}_${slug}`),
        AsyncStorage.getItem(`completed_story_${userInfo.uid}_${slug}`),
      ]);

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
    if (!userInfo?.uid) return;

    try {
      await Promise.all([
        AsyncStorage.setItem(`completed_story_${userInfo.uid}_${slug}`, 'true'),
        AsyncStorage.setItem(`progress_${userInfo.uid}_${slug}`, '100'),
      ]);
      setIsCompleted(true);
      setProgress(100);

      // Update completed stories list for achievements
      const completedStories = await AsyncStorage.getItem(`completedStories_${userInfo.uid}`);
      const completedList = completedStories ? JSON.parse(completedStories) : [];
      if (!completedList.includes(slug)) {
        completedList.push(slug);
        await AsyncStorage.setItem(
          `completedStories_${userInfo.uid}`,
          JSON.stringify(completedList)
        );
      }
    } catch (error) {
      console.error('Error marking story as completed:', error);
    }
  };

  const saveProgress = async (offsetY, contentHeight, viewportHeight) => {
    if (!userInfo?.uid) return;

    try {
      if (contentHeight <= 0) return;
      if (isCompleted) return 100;

      const scrollableHeight = contentHeight - viewportHeight;
      if (scrollableHeight <= 0) return;

      const newProgress = Math.min(Math.max((offsetY / scrollableHeight) * 100, 0), 100);

      if (!isCompleted) {
        await Promise.all([
          AsyncStorage.setItem(`progress_${userInfo.uid}_${slug}`, newProgress.toString()),
          AsyncStorage.setItem(`scroll_${userInfo.uid}_${slug}`, offsetY.toString()),
        ]);

        if (storyData) {
          const lastReadData = {
            ...storyData,
            progress: newProgress,
            lastReadAt: Date.now(),
            scrollPosition: offsetY,
            isCompleted: newProgress >= 95,
          };
          await AsyncStorage.setItem(`lastRead_${userInfo.uid}`, JSON.stringify(lastReadData));
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
