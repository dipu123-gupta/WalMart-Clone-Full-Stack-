import { createSlice } from '@reduxjs/toolkit';

const searchSlice = createSlice({
  name: 'search',
  initialState: {
    query: '',
    suggestions: [],
    recentSearches: JSON.parse(localStorage.getItem('recentSearches') || '[]'),
    isOpen: false,
  },
  reducers: {
    setQuery: (state, action) => { state.query = action.payload; },
    setSuggestions: (state, action) => { state.suggestions = action.payload; },
    setSearchOpen: (state, action) => { state.isOpen = action.payload; },
    addRecentSearch: (state, action) => {
      const filtered = state.recentSearches.filter(q => q !== action.payload);
      state.recentSearches = [action.payload, ...filtered].slice(0, 5);
      localStorage.setItem('recentSearches', JSON.stringify(state.recentSearches));
    },
    clearSearch: (state) => { state.query = ''; state.suggestions = []; state.isOpen = false; },
  },
});

export const { setQuery, setSuggestions, setSearchOpen, clearSearch, addRecentSearch } = searchSlice.actions;
export default searchSlice.reducer;
