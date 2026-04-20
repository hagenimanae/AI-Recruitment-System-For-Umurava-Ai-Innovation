import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = `${getApiBaseUrl()}/jobs`;

// Get auth headers with token
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchJobs = createAsyncThunk('jobs/fetchJobs', async () => {
  const response = await axios.get(API_URL, { headers: getAuthHeaders() });
  return response.data;
});

export const createJob = createAsyncThunk('jobs/createJob', async (jobData: any) => {
  const response = await axios.post(API_URL, jobData, { headers: getAuthHeaders() });
  return response.data;
});

export const deleteJob = createAsyncThunk('jobs/deleteJob', async (jobId: string) => {
  await axios.delete(`${API_URL}/${jobId}`, { headers: getAuthHeaders() });
  return jobId;
});

const jobsSlice = createSlice({
  name: 'jobs',
  initialState: {
    list: [],
    loading: false,
    error: null as string | null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchJobs.pending, (state) => { state.loading = true; })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch jobs';
      })
      .addCase(createJob.fulfilled, (state: any, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(deleteJob.fulfilled, (state: any, action) => {
        state.list = state.list.filter((job: any) => job._id !== action.payload);
      });
  }
});

export default jobsSlice.reducer;
