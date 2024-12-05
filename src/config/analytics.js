// src/config/analytics.js
import { vexo } from 'vexo-analytics';

export const initializeAnalytics = () => {
  try {
    vexo(process.env.EXPO_PUBLIC_VEXO_ANALYTICS_KEY);
  } catch (error) {
    console.error('Error initializing analytics:', error);
  }
};
