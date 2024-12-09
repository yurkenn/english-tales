import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserStatsContext = createContext();

export const useUserStats = () => useContext(UserStatsContext);

// Define reader levels
const READER_LEVELS = {
  1: { title: 'Novice Reader', requirement: 0 },
  2: { title: 'Bookworm', requirement: 5 },
  3: { title: 'Story Explorer', requirement: 10 },
  4: { title: 'Tale Master', requirement: 20 },
  5: { title: 'Legend Reader', requirement: 30 },
};

export const UserStatsProvider = ({ children }) => {
  const [stats, setStats] = useState({
    storiesRead: 0,
    timeSpent: 0, // in minutes
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
    completedStories: new Set(),
    readingProgress: {}, // stores progress for each story
    achievements: new Set(),
  });

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  // Load stats from AsyncStorage
  const loadStats = async () => {
    try {
      const savedStats = await AsyncStorage.getItem('userStats');
      if (savedStats) {
        const parsedStats = JSON.parse(savedStats);
        // Convert arrays back to Sets
        setStats({
          ...parsedStats,
          completedStories: new Set(parsedStats.completedStories),
          achievements: new Set(parsedStats.achievements),
        });
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Save stats to AsyncStorage
  const saveStats = async (newStats) => {
    try {
      const statsToSave = {
        ...newStats,
        completedStories: Array.from(newStats.completedStories),
        achievements: Array.from(newStats.achievements),
      };
      await AsyncStorage.setItem('userStats', JSON.stringify(statsToSave));
    } catch (error) {
      console.error('Error saving user stats:', error);
    }
  };

  // Update streak
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastRead = stats.lastReadDate ? new Date(stats.lastReadDate).toDateString() : null;

    if (!lastRead || lastRead !== today) {
      const isConsecutiveDay = lastRead === new Date(Date.now() - 86400000).toDateString();
      const newStreak = isConsecutiveDay ? stats.currentStreak + 1 : 1;
      const newLongestStreak = Math.max(newStreak, stats.longestStreak);

      setStats((prevStats) => {
        const newStats = {
          ...prevStats,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastReadDate: today,
        };
        saveStats(newStats);
        return newStats;
      });
    }
  };

  // Start reading a story
  const startReading = (storyId) => {
    updateStreak();
  };

  // Update reading progress for a story
  const updateReadingProgress = (storyId, progress) => {
    setStats((prevStats) => {
      const newStats = {
        ...prevStats,
        readingProgress: {
          ...prevStats.readingProgress,
          [storyId]: progress,
        },
        timeSpent: prevStats.timeSpent + 1, // Increment reading time
      };
      saveStats(newStats);
      return newStats;
    });
  };

  // Mark a story as completed
  const completeStory = async (storyId) => {
    setStats((prevStats) => {
      const newCompletedStories = new Set(prevStats.completedStories).add(storyId);
      const newStats = {
        ...prevStats,
        completedStories: newCompletedStories,
        storiesRead: prevStats.storiesRead + 1,
      };
      saveStats(newStats);
      return newStats;
    });
  };

  // Calculate reader level based on stories read
  const calculateReaderLevel = () => {
    const storiesCount = stats.storiesRead;
    let level = 1;

    for (const [lvl, data] of Object.entries(READER_LEVELS)) {
      if (storiesCount >= data.requirement) {
        level = Number(lvl);
      } else {
        break;
      }
    }

    return {
      level,
      title: READER_LEVELS[level].title,
      nextLevelRequirement:
        READER_LEVELS[level + 1]?.requirement || READER_LEVELS[level].requirement,
    };
  };

  // Format stats for display
  const formattedStats = {
    storiesRead: stats.storiesRead.toString(),
    timeSpent: `${Math.floor(stats.timeSpent / 60)}h ${stats.timeSpent % 60}m`,
    currentStreak: `${stats.currentStreak} days`,
    achievementProgress: Math.round(
      (stats.achievements.size / Object.keys(READER_LEVELS).length) * 100
    ),
    readerLevel: calculateReaderLevel(),
  };

  const value = {
    stats,
    formattedStats,
    startReading,
    updateReadingProgress,
    completeStory,
  };

  return <UserStatsContext.Provider value={value}>{children}</UserStatsContext.Provider>;
};
