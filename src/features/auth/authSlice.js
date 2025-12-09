// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
  isAuthenticated: !!localStorage.getItem("accessToken"),
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    loginSuccess: (state, action) => {
      const { access, refresh, user } = action.payload;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.user = user || { id: action.payload.data?.id };
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem("accessToken", access);
      if (refresh) {
        localStorage.setItem("refreshToken", refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    registerSuccess: (state, action) => {
      const { access, refresh, user } = action.payload;
      state.accessToken = access;
      state.refreshToken = refresh;
      state.user = user || { id: action.payload.data?.id };
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      localStorage.setItem("accessToken", access);
      if (refresh) {
        localStorage.setItem("refreshToken", refresh);
      }
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    },
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload) {
        localStorage.setItem("user", JSON.stringify(action.payload));
      }
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  loginSuccess,
  registerSuccess,
  logout,
  setUser,
} = authSlice.actions;

export default authSlice.reducer;

