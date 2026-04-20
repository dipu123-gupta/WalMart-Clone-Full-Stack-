import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

export const fetchWishlist = createAsyncThunk('wishlist/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/wishlist');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId, { getState, rejectWithValue }) => {
  try {
    const { wishlist } = getState();
    const exists = wishlist.items.find((i) => i.productId?._id === productId || i.productId === productId);
    if (exists) {
      await api.delete(`/wishlist/${productId}`);
      return { removed: productId };
    } else {
      await api.post(`/wishlist/${productId}`);
      return { added: productId };
    }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], isLoading: false },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => { state.items = action.payload || []; })
      .addCase(toggleWishlist.fulfilled, (state, action) => {
        if (action.payload.removed) {
          state.items = state.items.filter(
            (i) => (i.productId?._id || i.productId) !== action.payload.removed
          );
        }
      });
  },
});

export default wishlistSlice.reducer;
