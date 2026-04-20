import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  if (!raw) return 'http://localhost:5000/api';
  const trimmed = raw.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const API_URL = getApiBaseUrl();

// Get auth headers with token
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchApplicants = createAsyncThunk('applicants/fetchApplicants', async (jobId: string) => {
  const response = await axios.get(`${API_URL}/applicants/${jobId}`, { headers: getAuthHeaders() });
  return response.data;
});

export const fetchScreeningResults = createAsyncThunk('applicants/fetchScreeningResults', async (jobId: string) => {
  const response = await axios.get(`${API_URL}/ai/${jobId}/results`, { headers: getAuthHeaders() });
  return response.data;
});

export const triggerScreening = createAsyncThunk('applicants/triggerScreening', async (jobId: string) => {
  const response = await axios.post(`${API_URL}/ai/${jobId}/screen`, {}, { headers: getAuthHeaders() });
  return response.data;
});

export const deleteApplicant = createAsyncThunk('applicants/deleteApplicant', async ({ applicantId, jobId }: { applicantId: string; jobId: string }) => {
  await axios.delete(`${API_URL}/applicants/single/${applicantId}`, { headers: getAuthHeaders() });
  return { applicantId, jobId };
});

const applicantsSlice = createSlice({
  name: 'applicants',
  initialState: {
    list: [] as any[],
    results: [] as any[],
    loading: false,
    screeningLoading: false,
    error: null as string | null
  },
  reducers: {
    clearApplicants: (state) => {
       state.list = [];
       state.results = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApplicants.pending, (state) => {
        state.loading = true;
        state.results = [];
      })
      .addCase(fetchApplicants.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
        state.results = [];
      })
      .addCase(fetchScreeningResults.fulfilled, (state, action) => {
        state.results = action.payload;
      })
      .addCase(triggerScreening.pending, (state) => { state.screeningLoading = true; })
      .addCase(triggerScreening.fulfilled, (state, action) => {
        state.screeningLoading = false;
        state.results = action.payload; // Update list automatically
      })
      .addCase(triggerScreening.rejected, (state, action) => {
        state.screeningLoading = false;
        state.error = action.error.message || 'Screening Failed';
      })
      .addCase(deleteApplicant.fulfilled, (state, action) => {
        state.list = state.list.filter(a => a._id !== action.payload.applicantId);
        state.results = state.results.filter(r => r.applicantId?._id !== action.payload.applicantId);
      });
  }
});

export const { clearApplicants } = applicantsSlice.actions;
export default applicantsSlice.reducer;
