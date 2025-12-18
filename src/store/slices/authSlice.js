import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BASE_URL } from '../axios/axios';


const access = localStorage.getItem('access');
const refresh = localStorage.getItem('refresh');
const user_profile = localStorage.getItem('user_profile');
const user = localStorage.getItem('user');

console.log("Auth Slice - User Profile:", user_profile);  

const initialState = {
  admin: null,
  access: access,
  refresh: refresh,
  user_profile: user_profile ? JSON.parse(user_profile) : null,
  user: user ? JSON.parse(user) : null,
  error: null,
  isAuthenticated: false,
  loading: false,
  success: false,
};

// Login User
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/service/auth/login/`, credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

// Logout User
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const { access, refresh } = state.auth;

      if (!access || !refresh) return;

      await axios.post(`${BASE_URL}/service/auth/logout/`, { refresh: refresh }, {
        headers: {
          Authorization: `Bearer ${access}`,
        },
      });

      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.access = null;
      state.refresh = null;
      state.isAuthenticated = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action) => {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
      state.isAuthenticated = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login User
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.access = action.payload.access;
        state.refresh = action.payload.refresh;
        state.user = action.payload.user;
        // Use employee_profile if available, otherwise fallback to user_profile
        const profileData = action.payload.employee_profile || action.payload.user_profile;
        state.user_profile = profileData;
        localStorage.setItem('access', action.payload.access);
        localStorage.setItem('refresh', action.payload.refresh);
        localStorage.setItem('user_profile', JSON.stringify(profileData));
        localStorage.setItem('user', JSON.stringify(action.payload.user));

        state.isAuthenticated = true;
        state.error = null;
        state.success = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.user_profile = null;
        state.user = null;
        state.access = null;
        state.refresh = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
        localStorage.removeItem('user_profile');
        localStorage.removeItem('user');
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.access = null;
        state.refresh = null;
        state.isAuthenticated = false;
        state.error = null;
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      });
  },
});

export const { logout, clearError, setCredentials } = authSlice.actions;
export default authSlice.reducer;
