// src/hooks/useProfileSettings.js
import { useUserStats } from '../store/UserStatsContext';

export const useProfileSettings = () => {
  const { formattedStats } = useUserStats();

  const statistics = [
    { icon: 'book', value: formattedStats.storiesRead, label: 'Stories Read' },
    { icon: 'time', value: formattedStats.timeSpent, label: 'Time Spent' },
    { icon: 'star', value: formattedStats.completion, label: 'Completion' },
    { icon: 'trophy', value: formattedStats.achievements, label: 'Achievements' },
  ];

  return {
    statistics,
  };
};
