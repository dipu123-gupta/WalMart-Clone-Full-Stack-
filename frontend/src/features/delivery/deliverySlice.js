import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

export const fetchAgentProfile = createAsyncThunk(
  'delivery/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/delivery-agent/profile');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch agent profile');
    }
  }
);

export const toggleAgentAvailability = createAsyncThunk(
  'delivery/toggleAvailability',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/delivery-agent/toggle-availability');
      return data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update availability');
    }
  }
);

const deliverySlice = createSlice({
  name: 'delivery',
  initialState: {
    profile: null,
    isAvailable: true,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAgentProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAgentProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
        state.isAvailable = action.payload.isAvailable;
      })
      .addCase(fetchAgentProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleAgentAvailability.fulfilled, (state, action) => {
        state.isAvailable = action.payload.isAvailable;
        if (state.profile) {
          state.profile.isAvailable = action.payload.isAvailable;
        }
      });
  },
});

export default deliverySlice.reducer;
