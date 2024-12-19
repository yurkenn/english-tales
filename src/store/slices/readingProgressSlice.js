// src/store/slices/readingProgressSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  lastRead: null,
  readingProgress: {},
  loading: false,
  error: null,
};

export const updateLastRead = createAsyncThunk(
  'readingProgress/updateLastRead',
  async ({ userId, storyData }) => {
    try {
      const lastReadData = {
        ...storyData,
        lastReadAt: new Date().toISOString(),
      };

      // Save to AsyncStorage
      await AsyncStorage.setItem(`lastRead_${userId}`, JSON.stringify(lastReadData));

      return lastReadData;
    } catch (error) {
      throw error;
    }
  }
);

export const loadLastRead = createAsyncThunk('readingProgress/loadLastRead', async (userId) => {
  try {
    const data = await AsyncStorage.getItem(`lastRead_${userId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw error;
  }
});

export const updateReadingProgress = createAsyncThunk(
  'readingProgress/updateProgress',
  async ({ userId, storyId, progress }) => {
    try {
      const key = `progress_${userId}_${storyId}`;
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ progress, updatedAt: new Date().toISOString() })
      );
      return { storyId, progress };
    } catch (error) {
      throw error;
    }
  }
);

const readingProgressSlice = createSlice({
  name: 'readingProgress',
  initialState,
  reducers: {
    clearReadingProgress: (state) => {
      state.lastRead = null;
      state.readingProgress = {};
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Update Last Read
      .addCase(updateLastRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateLastRead.fulfilled, (state, action) => {
        state.lastRead = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(updateLastRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Load Last Read
      .addCase(loadLastRead.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadLastRead.fulfilled, (state, action) => {
        state.lastRead = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadLastRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      // Update Reading Progress
      .addCase(updateReadingProgress.fulfilled, (state, action) => {
        state.readingProgress[action.payload.storyId] = action.payload.progress;
      });
  },
});

export const { clearReadingProgress } = readingProgressSlice.actions;
export default readingProgressSlice.reducer;
