import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { auth } from '../../../firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

export const checkAuthState = createAsyncThunk('auth/checkState', async (_, { dispatch }) => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          emailVerified: firebaseUser.emailVerified,
        };
        resolve(userData);
      } else {
        resolve(null);
      }
    });
  });
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { email, password } = credentials;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        emailVerified: userCredential.user.emailVerified,
      };

      await AsyncStorage.setItem(`@user_${userData.uid}`, JSON.stringify(userData));
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async (idToken, { rejectWithValue }) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      const userData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        emailVerified: userCredential.user.emailVerified,
      };

      await AsyncStorage.setItem(`@user_${userData.uid}`, JSON.stringify(userData));
      return userData;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createUser = createAsyncThunk(
  'auth/createUser',
  async (userData, { rejectWithValue }) => {
    try {
      const { email, password, displayName } = userData;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, {
        displayName: displayName.trim(),
      });

      const userDataToStore = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName.trim(),
        photoURL: userCredential.user.photoURL,
        emailVerified: userCredential.user.emailVerified,
      };

      await AsyncStorage.setItem(`@user_${userDataToStore.uid}`, JSON.stringify(userDataToStore));
      return userDataToStore;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await signOut(auth);
    await AsyncStorage.removeItem('@user');
    return null;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: true, // Changed to true by default
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add checkAuthState cases
      .addCase(checkAuthState.pending, (state) => {
        state.loading = true;
      })
      .addCase(checkAuthState.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(checkAuthState.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Login cases
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        Toast.show({
          type: 'success',
          text1: 'Welcome back!',
        });
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Sign In Failed',
          text2: action.payload,
        });
      })

      // Google Sign In cases
      .addCase(googleSignIn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(googleSignIn.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        Toast.show({
          type: 'success',
          text1: 'Welcome!',
          text2: `Signed in with Google`,
        });
      })
      .addCase(googleSignIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Google Sign In Failed',
          text2: action.payload,
        });
      })

      // Create user cases
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.loading = false;
        state.error = null;
        Toast.show({
          type: 'success',
          text1: 'Account created successfully!',
          text2: `Welcome, ${action.payload.displayName}!`,
        });
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Signup Failed',
          text2: action.payload,
        });
      })

      // Logout cases
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.error = null;
        Toast.show({
          type: 'success',
          text1: 'Logged out successfully',
        });
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
        Toast.show({
          type: 'error',
          text1: 'Logout Failed',
          text2: action.payload,
        });
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
