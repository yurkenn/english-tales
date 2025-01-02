// src/store/slices/likeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLikes, updateLikes, unlikeTale } from '../../utils/sanity-utils';

const initialState = {
  likes: {}, // Object to store likes count for each tale
  userLikes: {}, // Object to track which tales user has liked
  loading: false,
  error: null,
};

// Fetch likes for a tale
export const fetchTaleLikes = createAsyncThunk(
  'likes/fetchTaleLikes',
  async (taleId, { rejectWithValue }) => {
    try {
      const likesCount = await fetchLikes(taleId);
      const likeStatus = await AsyncStorage.getItem(`liked_${taleId}`);
      return {
        taleId,
        likes: likesCount,
        hasLiked: likeStatus === 'true',
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Toggle like
export const toggleLike = createAsyncThunk(
  'likes/toggleLike',
  async ({ taleId }, { getState, rejectWithValue }) => {
    try {
      const { userLikes } = getState().likes;
      const hasLiked = userLikes[taleId];

      let result;
      if (!hasLiked) {
        // Like
        result = await updateLikes(taleId);
        await AsyncStorage.setItem(`liked_${taleId}`, 'true');
      } else {
        // Unlike
        result = await unlikeTale(taleId);
        await AsyncStorage.removeItem(`liked_${taleId}`);
      }

      return {
        taleId,
        likes: result,
        hasLiked: !hasLiked,
      };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const likeSlice = createSlice({
  name: 'likes',
  initialState,
  reducers: {
    clearLikes: (state) => {
      state.likes = {};
      state.userLikes = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaleLikes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaleLikes.fulfilled, (state, action) => {
        state.loading = false;
        state.likes[action.payload.taleId] = action.payload.likes;
        state.userLikes[action.payload.taleId] = action.payload.hasLiked;
      })
      .addCase(fetchTaleLikes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        state.likes[action.payload.taleId] = action.payload.likes;
        state.userLikes[action.payload.taleId] = action.payload.hasLiked;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearLikes } = likeSlice.actions;
export default likeSlice.reducer;
