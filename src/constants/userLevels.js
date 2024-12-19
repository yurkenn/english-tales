// src/constants/userLevels.js
export const READER_LEVELS = {
  1: { title: 'Novice Reader', requirement: 0 },
  2: { title: 'Bookworm', requirement: 5 },
  3: { title: 'Story Explorer', requirement: 10 },
  4: { title: 'Tale Master', requirement: 20 },
  5: { title: 'Legend Reader', requirement: 30 },
};

export const ACHIEVEMENTS = {
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
    description: 'Read 5 tales',
    icon: 'library-outline',
    requirement: (stats) => stats.storiesRead >= 5,
  },
  STORY_MASTER: {
    id: 'STORY_MASTER',
    title: 'Story Master',
    description: 'Complete 10 tales',
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
