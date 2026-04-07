import { createSlice } from '@reduxjs/toolkit';

const categorySlice = createSlice({
  name: 'categories',
  initialState: { items: [], loading: false },
  reducers: {
    setCategories: (state, action) => {
      state.items = action.payload;
    },
    addCategory: (state, action) => {
      state.items.unshift(action.payload);
    },
    updateCategory: (state, action) => {
      const index = state.items.findIndex(
        item => item.id === action.payload.id,
      );
      if (index !== -1) state.items[index] = action.payload;
    },
    removeCategory: (state, action) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
  },
});

export const { setCategories, addCategory, updateCategory, removeCategory } =
  categorySlice.actions;
export default categorySlice.reducer;
