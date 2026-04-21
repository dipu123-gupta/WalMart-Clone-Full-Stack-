import { createSlice } from '@reduxjs/toolkit';

const compareSlice = createSlice({
  name: 'compare',
  initialState: {
    items: [], // max 4 items
  },
  reducers: {
    addToCompare: (state, action) => {
      const product = action.payload;
      if (state.items.find((item) => item._id === product._id)) return;
      if (state.items.length >= 4) {
        state.items.shift(); // Remove oldest if more than 4
      }
      state.items.push(product);
    },
    removeFromCompare: (state, action) => {
      state.items = state.items.filter((item) => item._id !== action.payload);
    },
    clearCompare: (state) => {
      state.items = [];
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;
