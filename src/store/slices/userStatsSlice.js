import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  stats: {
    storiesRead: 0,
    timeSpent: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastReadDate: null,
    completedStories: [],
    readingProgress: {},
    achievements: [],
    readCategories: [],
  },
  loading: false,
  error: null,
};

// Helper function to ensure stats object has all required properties
const ensureValidStats = (stats) => {
  return {
    ...initialState.stats,
    ...stats,
    achievements: Array.isArray(stats?.achievements) ? stats.achievements : [],
    completedStories: Array.isArray(stats?.completedStories) ? stats.completedStories : [],
    readCategories: Array.isArray(stats?.readCategories) ? stats.readCategories : [],
    readingProgress: stats?.readingProgress || {},
  };
};

// Initialize user stats when they first sign up
export const initializeUserStats = createAsyncThunk('userStats/initialize', async (userId) => {
  try {
    const stats = initialState.stats;
    await AsyncStorage.setItem(`userStats_${userId}`, JSON.stringify(stats));
    return stats;
  } catch (error) {
    throw error;
  }
});

// Load user stats with validation
export const loadUserStats = createAsyncThunk('userStats/load', async (userId) => {
  try {
    const statsJson = await AsyncStorage.getItem(`userStats_${userId}`);
    const stats = statsJson ? JSON.parse(statsJson) : initialState.stats;
    return ensureValidStats(stats);
  } catch (error) {
    throw error;
  }
});

// Check achievement helper with null safety
const checkAchievement = (achievements = [], achievementId) => {
  return Array.isArray(achievements) && !achievements.includes(achievementId);
};

// Update streak
export const updateStreak = createAsyncThunk(
  'userStats/updateStreak',
  async ({ userId }, { getState }) => {
    try {
      const { stats } = getState().userStats;
      const validStats = ensureValidStats(stats);
      const today = new Date().toDateString();
      const lastRead = validStats.lastReadDate
        ? new Date(validStats.lastReadDate).toDateString()
        : null;

      if (!lastRead || lastRead !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const isConsecutiveDay = lastRead === yesterday;
        const newStreak = isConsecutiveDay ? validStats.currentStreak + 1 : 1;
        const newLongestStreak = Math.max(newStreak, validStats.longestStreak || 0);

        const newStats = {
          ...validStats,
          currentStreak: newStreak,
          longestStreak: newLongestStreak,
          lastReadDate: today,
        };

        const streakAchievements = [];
        if (checkAchievement(newStats.achievements, 'THREE_DAY_STREAK') && newStreak >= 3) {
          streakAchievements.push('THREE_DAY_STREAK');
        }
        if (checkAchievement(newStats.achievements, 'WEEK_WARRIOR') && newStreak >= 7) {
          streakAchievements.push('WEEK_WARRIOR');
        }

        if (streakAchievements.length > 0) {
          newStats.achievements = [...(newStats.achievements || []), ...streakAchievements];
        }

        await AsyncStorage.setItem(`userStats_${userId}`, JSON.stringify(newStats));
        return newStats;
      }

      return validStats;
    } catch (error) {
      console.error('Error in updateStreak:', error);
      throw error;
    }
  }
);

// Update reading progress with enhanced error handling
export const updateReadingProgress = createAsyncThunk(
  'userStats/updateProgress',
  async ({ userId, storyId, progress, category }, { getState }) => {
    try {
      const { stats } = getState().userStats;
      const validStats = ensureValidStats(stats);

      let newStats = {
        ...validStats,
        readingProgress: {
          ...(validStats.readingProgress || {}),
          [storyId]: progress,
        },
        timeSpent: (validStats.timeSpent || 0) + 1,
      };

      // Add category if it's new
      if (
        category &&
        Array.isArray(newStats.readCategories) &&
        !newStats.readCategories.includes(category)
      ) {
        newStats.readCategories = [...newStats.readCategories, category];
      }

      // Update completed stories if 100% progress
      if (
        progress === 100 &&
        Array.isArray(newStats.completedStories) &&
        !newStats.completedStories.includes(storyId)
      ) {
        newStats.completedStories = [...newStats.completedStories, storyId];
        newStats.storiesRead = (newStats.storiesRead || 0) + 1;
      }

      // Check for new achievements with null safety
      const newAchievements = [];

      // Reading achievements
      if (checkAchievement(newStats.achievements, 'FIRST_STORY') && newStats.storiesRead >= 1) {
        newAchievements.push('FIRST_STORY');
      }
      if (
        checkAchievement(newStats.achievements, 'STORY_COLLECTOR') &&
        newStats.storiesRead >= 10
      ) {
        newAchievements.push('STORY_COLLECTOR');
      }

      // Category achievements
      if (
        checkAchievement(newStats.achievements, 'GENRE_EXPLORER') &&
        newStats.readCategories.length >= 5
      ) {
        newAchievements.push('GENRE_EXPLORER');
      }

      // Completion achievements
      if (
        checkAchievement(newStats.achievements, 'COMPLETIONIST') &&
        newStats.completedStories.length >= 5
      ) {
        newAchievements.push('COMPLETIONIST');
      }

      if (newAchievements.length > 0) {
        newStats.achievements = [...(newStats.achievements || []), ...newAchievements];
      }

      await AsyncStorage.setItem(`userStats_${userId}`, JSON.stringify(newStats));
      return newStats;
    } catch (error) {
      console.error('Error in updateReadingProgress:', error);
      throw error;
    }
  }
);

const userStatsSlice = createSlice({
  name: 'userStats',
  initialState,
  reducers: {
    resetStats: (state) => {
      state.stats = initialState.stats;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(initializeUserStats.fulfilled, (state, action) => {
        state.stats = ensureValidStats(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(loadUserStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserStats.fulfilled, (state, action) => {
        state.stats = ensureValidStats(action.payload);
        state.loading = false;
        state.error = null;
      })
      .addCase(loadUserStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateReadingProgress.fulfilled, (state, action) => {
        state.stats = ensureValidStats(action.payload);
        state.error = null;
      })
      .addCase(updateReadingProgress.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(updateStreak.fulfilled, (state, action) => {
        state.stats = ensureValidStats(action.payload);
        state.error = null;
      })
      .addCase(updateStreak.rejected, (state, action) => {
        state.error = action.error.message;
      });
  },
});

export const { resetStats } = userStatsSlice.actions;
export default userStatsSlice.reducer;
