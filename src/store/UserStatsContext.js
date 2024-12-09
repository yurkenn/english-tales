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

const ACHIEVEMENTS = {
  FIRST_STORY: {
    id: 'FIRST_STORY',
    title: 'First Steps',
    description: 'Read your first story',
    icon: 'book-outline',
    requirement: (stats) => stats.storiesRead >= 1,
  },
  BOOKWORM: {
    id: 'BOOKWORM',
    title: 'Bookworm',
    description: 'Read 5 stories',
    icon: 'library-outline',
    requirement: (stats) => stats.storiesRead >= 5,
  },
  STORY_MASTER: {
    id: 'STORY_MASTER',
    title: 'Story Master',
    description: 'Complete 10 stories',
    icon: 'trophy-outline',
    requirement: (stats) => stats.storiesRead >= 10,
  },
  STREAK_MASTER: {
    id: 'STREAK_MASTER',
    title: 'Streak Master',
    description: 'Maintain a 7-day reading streak',
    icon: 'flame-outline',
    requirement: (stats) => stats.currentStreak >= 7,
  },
  TIME_TRAVELER: {
    id: 'TIME_TRAVELER',
    title: 'Time Traveler',
    description: 'Read for more than 2 hours total',
    icon: 'time-outline',
    requirement: (stats) => stats.timeSpent >= 120,
  },
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

  const checkAndUpdateAchievements = (currentStats) => {
    let achievementsChanged = false;
    const newAchievements = new Set(currentStats.achievements);

    Object.values(ACHIEVEMENTS).forEach((achievement) => {
      if (!newAchievements.has(achievement.id) && achievement.requirement(currentStats)) {
        newAchievements.add(achievement.id);
        achievementsChanged = true;
        console.log(`Achievement unlocked: ${achievement.title}`); // Debug log
      }
    });

    if (achievementsChanged) {
      const newStats = {
        ...currentStats,
        achievements: newAchievements,
      };
      setStats(newStats);
      saveStats(newStats);
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
        checkAndUpdateAchievements(newStats); // Add achievement check
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
        timeSpent: prevStats.timeSpent + 1,
      };
      checkAndUpdateAchievements(newStats);
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

      // Check achievements immediately after updating stats
      setTimeout(() => checkAndUpdateAchievements(newStats), 0);
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
    readerLevel: calculateReaderLevel(),
    achievements: Object.values(ACHIEVEMENTS).map((achievement) => ({
      ...achievement,
      isUnlocked: stats.achievements.has(achievement.id),
    })),
    achievementProgress: Math.round(
      (stats.achievements.size / Object.keys(ACHIEVEMENTS).length) * 100
    ),
  };

  const value = {
    stats,
    formattedStats,
    startReading,
    updateReadingProgress,
    completeStory,
    ACHIEVEMENTS,
  };

  return <UserStatsContext.Provider value={value}>{children}</UserStatsContext.Provider>;
};
