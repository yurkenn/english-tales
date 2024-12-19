// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import bookmarkReducer from './slices/bookmarkSlice';
import likeReducer from './slices/likeSlice';
import fontSizeReducer from './slices/fontSizeSlice';
import userStatsReducer from './slices/userStatsSlice';
import readingProgressReducer from './slices/readingProgressSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    bookmarks: bookmarkReducer,
    likes: likeReducer,
    fontSize: fontSizeReducer,
    userStats: userStatsReducer,
    readingProgress: readingProgressReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these paths in the state
        ignoredPaths: [
          'auth.user.proactiveRefresh',
          'auth.user.reloadListener',
          'auth.user.stsTokenManager',
        ],
        // Ignore these action types
        ignoredActions: ['auth/createUser/fulfilled', 'auth/loginUser/fulfilled'],
      },
    }),
});
