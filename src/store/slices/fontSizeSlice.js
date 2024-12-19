// src/store/slices/fontSizeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  fontSize: 16,
  loading: false,
  error: null,
};

export const loadFontSize = createAsyncThunk('fontSize/load', async (_, { rejectWithValue }) => {
  try {
    const savedFontSize = await AsyncStorage.getItem('font_size');
    return savedFontSize ? Number(savedFontSize) : 16;
  } catch (error) {
    return rejectWithValue('Error loading font size');
  }
});

export const changeFontSize = createAsyncThunk(
  'fontSize/change',
  async (newSize, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem('font_size', newSize.toString());
      return newSize;
    } catch (error) {
      return rejectWithValue('Error saving font size');
    }
  }
);

const fontSizeSlice = createSlice({
  name: 'fontSize',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFontSize.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadFontSize.fulfilled, (state, action) => {
        state.fontSize = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadFontSize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(changeFontSize.fulfilled, (state, action) => {
        state.fontSize = action.payload;
        state.error = null;
      })
      .addCase(changeFontSize.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default fontSizeSlice.reducer;
