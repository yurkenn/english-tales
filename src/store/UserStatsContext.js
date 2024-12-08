// src/store/UserStatsContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserStatsContext = createContext();

export const UserStatsProvider = ({ children }) => {
  const [userStats, setUserStats] = useState({
    storiesRead: 0,
    totalTimeSpent: 0, // in minutes
    completedStories: [], // array of story IDs
    lastReadTimestamps: {}, // { storyId: timestamp }
    readingProgress: {}, // { storyId: percentage }
  });

  // Load stats on mount
  useEffect(() => {
    loadUserStats();
  }, []);

  // Save stats whenever they change
  useEffect(() => {
    saveUserStats();
  }, [userStats]);

  const loadUserStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('userReadingStats');
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const saveUserStats = async () => {
    try {
      await AsyncStorage.setItem('userReadingStats', JSON.stringify(userStats));
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  };

  const startReading = async (storyId) => {
    setUserStats((prev) => ({
      ...prev,
      lastReadTimestamps: {
        ...prev.lastReadTimestamps,
        [storyId]: Date.now(),
      },
    }));
  };

  const updateReadingProgress = async (storyId, progress) => {
    setUserStats((prev) => ({
      ...prev,
      readingProgress: {
        ...prev.readingProgress,
        [storyId]: progress,
      },
    }));
  };

  const completeStory = async (storyId) => {
    const startTime = userStats.lastReadTimestamps[storyId];
    if (startTime) {
      const timeSpent = Math.floor((Date.now() - startTime) / 60000); // Convert to minutes

      setUserStats((prev) => ({
        ...prev,
        storiesRead: prev.storiesRead + 1,
        totalTimeSpent: prev.totalTimeSpent + timeSpent,
        completedStories: [...prev.completedStories, storyId],
        readingProgress: {
          ...prev.readingProgress,
          [storyId]: 100,
        },
      }));
    }
  };

  const getFormattedStats = () => {
    const totalHours = Math.floor(userStats.totalTimeSpent / 60);
    const remainingMinutes = userStats.totalTimeSpent % 60;
    const timeSpentFormatted =
      totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m`;

    const totalStories = Object.keys(userStats.readingProgress).length;
    const completionRate =
      totalStories > 0 ? Math.round((userStats.completedStories.length / totalStories) * 100) : 0;

    return {
      storiesRead: userStats.storiesRead.toString(),
      timeSpent: timeSpentFormatted,
      completion: `${completionRate}%`,
      achievements: calculateAchievements(),
    };
  };

  const calculateAchievements = () => {
    let achievements = 0;

    // Reading milestones
    if (userStats.storiesRead >= 5) achievements++;
    if (userStats.storiesRead >= 10) achievements++;
    if (userStats.storiesRead >= 25) achievements++;

    // Time spent milestones (in hours)
    const hoursSpent = userStats.totalTimeSpent / 60;
    if (hoursSpent >= 1) achievements++;
    if (hoursSpent >= 5) achievements++;
    if (hoursSpent >= 10) achievements++;

    // Completion rate milestones
    const completionRate =
      userStats.completedStories.length / Object.keys(userStats.readingProgress).length;
    if (completionRate >= 0.5) achievements++;
    if (completionRate >= 0.8) achievements++;

    return achievements.toString();
  };

  return (
    <UserStatsContext.Provider
      value={{
        stats: userStats,
        formattedStats: getFormattedStats(),
        startReading,
        updateReadingProgress,
        completeStory,
      }}
    >
      {children}
    </UserStatsContext.Provider>
  );
};

export const useUserStats = () => {
  const context = useContext(UserStatsContext);
  if (!context) {
    throw new Error('useUserStats must be used within a UserStatsProvider');
  }
  return context;
};
