import { ACHIEVEMENTS, READER_LEVELS } from '../constants/userLevels';

// Auth selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

// Bookmark selectors
export const selectBookmarks = (state) => state.bookmarks.bookmarks;
export const selectBookmarksLoading = (state) => state.bookmarks.loading;
export const selectBookmarksError = (state) => state.bookmarks.error;

// Likes selectors
export const selectLikes = (state) => state.likes.likes;
export const selectUserLikes = (state) => state.likes.userLikes;
export const selectLikesLoading = (state) => state.likes.loading;
export const selectLikesError = (state) => state.likes.error;

// Font size selectors
export const selectFontSize = (state) => state.fontSize.fontSize;
export const selectFontSizeLoading = (state) => state.fontSize.loading;
export const selectFontSizeError = (state) => state.fontSize.error;

// User Stats selectors
export const selectUserStats = (state) => state.userStats.stats;
export const selectUserStatsLoading = (state) => state.userStats.loading;
export const selectUserStatsError = (state) => state.userStats.error;

export const selectFormattedStats = (state) => {
  const stats = state.userStats.stats;

  // Format achievements with progress
  const achievements = Object.values(ACHIEVEMENTS).map((achievement) => {
    const isUnlocked = achievement.requirement(stats);
    let progress = 0;

    // Calculate progress based on achievement type
    switch (achievement.id) {
      case 'FIRST_STORY':
        progress = Math.min((stats.storiesRead / 1) * 100, 100);
        break;
      case 'BOOKWORM':
        progress = Math.min((stats.storiesRead / 5) * 100, 100);
        break;
      case 'STORY_MASTER':
        progress = Math.min((stats.storiesRead / 10) * 100, 100);
        break;
      case 'STREAK_MASTER':
        progress = Math.min((stats.currentStreak / 7) * 100, 100);
        break;
      case 'TIME_TRAVELER':
        progress = Math.min((stats.timeSpent / 120) * 100, 100);
        break;
      default:
        progress = 0;
    }

    return {
      ...achievement,
      isUnlocked,
      progress: Math.round(progress),
    };
  });

  // Calculate reader level
  const readerLevel = calculateReaderLevel(stats.storiesRead);

  // Calculate overall achievement progress
  const achievementProgress = Math.round(
    (achievements.filter((a) => a.isUnlocked).length / achievements.length) * 100
  );

  return {
    storiesRead: stats.storiesRead?.toString() || '0',
    timeSpent: formatTimeSpent(stats.timeSpent || 0),
    currentStreak: `${stats.currentStreak || 0} days`,
    achievementProgress,
    readerLevel,
    achievements,
  };
};

// Helper functions
const calculateReaderLevel = (storiesRead) => {
  let currentLevel = 1;

  for (const [level, data] of Object.entries(READER_LEVELS)) {
    if (storiesRead >= data.requirement) {
      currentLevel = Number(level);
    } else {
      break;
    }
  }

  const currentLevelData = READER_LEVELS[currentLevel];
  const nextLevelData = READER_LEVELS[currentLevel + 1];

  let progress = 100;
  if (nextLevelData) {
    const currentLevelStories = storiesRead - currentLevelData.requirement;
    const storiesNeeded = nextLevelData.requirement - currentLevelData.requirement;
    progress = Math.min(Math.round((currentLevelStories / storiesNeeded) * 100), 100);
  }

  return {
    level: currentLevel,
    title: currentLevelData.title,
    progress,
  };
};

const formatTimeSpent = (minutes) => {
  if (minutes === 0) return '0m';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};
