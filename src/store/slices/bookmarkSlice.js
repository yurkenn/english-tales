// src/store/slices/bookmarkSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const initialState = {
  bookmarks: [],
  loading: false,
  error: null,
};

// Load bookmarks for a user
export const loadBookmarks = createAsyncThunk(
  'bookmarks/loadBookmarks',
  async (userId, { rejectWithValue }) => {
    try {
      const storedBookmarks = await AsyncStorage.getItem(`bookmarks_${userId}`);
      return storedBookmarks ? JSON.parse(storedBookmarks) : [];
    } catch (error) {
      return rejectWithValue('Error loading bookmarks');
    }
  }
);

// Toggle bookmark (add/remove)
export const toggleBookmark = createAsyncThunk(
  'bookmarks/toggleBookmark',
  async ({ bookData, userId }, { getState, rejectWithValue }) => {
    try {
      const { bookmarks } = getState().bookmarks;
      const existingBookmark = bookmarks.find(
        (bookmark) => bookmark.slug.current === bookData.slug.current
      );

      let updatedBookmarks;
      if (existingBookmark) {
        // Remove bookmark
        updatedBookmarks = bookmarks.filter(
          (bookmark) => bookmark.slug.current !== bookData.slug.current
        );
      } else {
        // Add bookmark
        updatedBookmarks = [...bookmarks, bookData];
      }

      await AsyncStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));
      return {
        bookmarks: updatedBookmarks,
        isBookmarked: !existingBookmark,
      };
    } catch (error) {
      return rejectWithValue('Error updating bookmark');
    }
  }
);

// Remove bookmark
export const removeBookmark = createAsyncThunk(
  'bookmarks/removeBookmark',
  async ({ bookData, userId }, { getState, rejectWithValue }) => {
    try {
      const { bookmarks } = getState().bookmarks;
      const updatedBookmarks = bookmarks.filter(
        (bookmark) => bookmark.slug.current !== bookData.slug.current
      );
      await AsyncStorage.setItem(`bookmarks_${userId}`, JSON.stringify(updatedBookmarks));
      return updatedBookmarks;
    } catch (error) {
      return rejectWithValue('Error removing bookmark');
    }
  }
);

const bookmarkSlice = createSlice({
  name: 'bookmarks',
  initialState,
  reducers: {
    clearBookmarks: (state) => {
      state.bookmarks = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Load bookmarks
      .addCase(loadBookmarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadBookmarks.fulfilled, (state, action) => {
        state.loading = false;
        state.bookmarks = action.payload;
        state.error = null;
      })
      .addCase(loadBookmarks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Toggle bookmark
      .addCase(toggleBookmark.pending, (state) => {
        state.loading = true;
      })
      .addCase(toggleBookmark.fulfilled, (state, action) => {
        state.loading = false;
        state.bookmarks = action.payload.bookmarks;
        state.error = null;
        Toast.show({
          type: action.payload.isBookmarked ? 'success' : 'error',
          text1: action.payload.isBookmarked ? 'Bookmark added!' : 'Bookmark removed!',
          position: 'top',
          topOffset: 90,
        });
      })
      .addCase(toggleBookmark.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
        });
      })

      // Remove bookmark
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.bookmarks = action.payload;
        state.error = null;
        Toast.show({
          type: 'success',
          text1: 'Bookmark removed successfully',
        });
      })
      .addCase(removeBookmark.rejected, (state, action) => {
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: action.payload,
        });
      });
  },
});

export const { clearBookmarks } = bookmarkSlice.actions;
export default bookmarkSlice.reducer;
