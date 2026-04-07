import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: null,
  user: null,
  isAdmin: false,
  isGuest: false,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // 🔄 Start login
    loginStart: state => {
      state.loading = true;
      state.error = null;
    },

    // ✅ Login success
    loginSuccess: (state, action) => {
      const { user, access_token } = action.payload;

      state.token = access_token;
      state.user = user;
      state.isAdmin = user.user_type === 'admin';
      state.isGuest = false;
      state.isAuthenticated = true;
      state.loading = false;
    },

    // ❌ Login failed
    loginFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // 🚪 Logout
    logout: state => {
      state.user = null;
      state.token = null;
      state.isAdmin = false;
      state.isGuest = false;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },

    // ⏳ Loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    // 👤 Guest login
    setGuest: state => {
      state.user = {
        username: 'Guest',
        user_type: 'guest',
      };
      state.token = null;
      state.isAuthenticated = false;
      state.isAdmin = false;
      state.isGuest = true;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setLoading,
  setGuest,
} = authSlice.actions;

export default authSlice.reducer;
