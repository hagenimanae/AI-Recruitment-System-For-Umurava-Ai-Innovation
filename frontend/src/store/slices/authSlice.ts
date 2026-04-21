import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = getApiBaseUrl();

// Setup axios interceptor to handle 401 errors globally
let logoutCallback: (() => void) | null = null;

export const setLogoutCallback = (callback: () => void) => {
  logoutCallback = callback;
};

// Axios interceptor to handle 401 errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const errorCode = error.response?.data?.error;
      const message = error.response?.data?.message || '';
      
      // Token expired or invalid - clear storage and logout
      if (errorCode === 'TokenExpired' || errorCode === 'TokenInvalid' || message.includes('Session')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.setItem('sessionExpired', 'true');
        
        if (logoutCallback) {
          logoutCallback();
        }
        
        // Redirect to login page if not already there
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter';
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

// Get initial state from localStorage (client-side only)
const getInitialState = (): AuthState => {
  if (typeof window === 'undefined') {
    return {
      user: null,
      token: null,
      loading: false,
      error: null,
      isAuthenticated: false
    };
  }
  
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  return {
    user: userStr ? JSON.parse(userStr) : null,
    token,
    loading: false,
    error: null,
    isAuthenticated: !!token
  };
};

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, role }: { name: string; email: string; password: string; role: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      return { token, user };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('sessionExpired');
  return null;
});

// Check if session expired flag is set
export const checkSessionExpired = (): boolean => {
  if (typeof window === 'undefined') return false;
  const expired = localStorage.getItem('sessionExpired');
  if (expired) {
    localStorage.removeItem('sessionExpired');
    return true;
  }
  return false;
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    initializeAuth: (state) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        
        if (token && userStr) {
          state.token = token;
          state.user = JSON.parse(userStr);
          state.isAuthenticated = true;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });
  }
});

export const { initializeAuth, clearError } = authSlice.actions;
export default authSlice.reducer;

// Initialize logout callback for axios interceptor
export const initAuthInterceptors = (dispatch: any) => {
  setLogoutCallback(() => {
    dispatch(logout());
  });
};
