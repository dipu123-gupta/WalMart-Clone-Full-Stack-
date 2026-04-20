import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/cart');
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const addToCart = createAsyncThunk('cart/addItem', async (item, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/items', item);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
  }
});

export const updateCartItem = createAsyncThunk('cart/updateItem', async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const removeCartItem = createAsyncThunk('cart/removeItem', async (itemId, { rejectWithValue }) => {
  try {
    const { data } = await api.delete(`/cart/items/${itemId}`);
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const syncCart = createAsyncThunk('cart/sync', async (sessionId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/sync', { sessionId });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message);
  }
});

export const applyCoupon = createAsyncThunk('cart/applyCoupon', async (code, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/cart/apply-coupon', { code });
    return data.data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || 'Invalid coupon');
  }
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    couponCode: null,
    couponDiscount: 0,
    warnings: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearCartState: (state) => {
      state.items = [];
      state.couponCode = null;
      state.couponDiscount = 0;
      state.warnings = [];
    },
  },
  extraReducers: (builder) => {
    const setCartData = (state, action) => {
      state.isLoading = false;
      state.items = action.payload.items || [];
      state.couponCode = action.payload.couponCode;
      state.couponDiscount = action.payload.couponDiscount || 0;
      state.warnings = action.payload.warnings || [];
    };

    builder
      .addCase(fetchCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchCart.fulfilled, setCartData)
      .addCase(addToCart.fulfilled, setCartData)
      .addCase(updateCartItem.fulfilled, setCartData)
      .addCase(removeCartItem.fulfilled, setCartData)
      .addCase(syncCart.fulfilled, setCartData)
      .addCase(applyCoupon.fulfilled, setCartData)
      .addCase(applyCoupon.rejected, (state, action) => { state.error = action.payload; });
  },
});

export const { clearCartState } = cartSlice.actions;
export default cartSlice.reducer;
