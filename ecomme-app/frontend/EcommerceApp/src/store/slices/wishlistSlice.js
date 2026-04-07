import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlistItems: (state, action) => {
      // Normalize: if backend sends { product, id } wrapper, unwrap it
      const unwrapped = (action.payload || []).map(
        item => item?.product || item,
      );
      state.items = unwrapped;
    },

    addToWishlist: (state, action) => {
      // action.payload can be { product } OR plain product
      const product = action.payload?.product || action.payload;
      if (!product?.id) return;

      // Do not use item.product.id; use item.id for plain product
      const alreadyExists = state.items.some(item => item.id === product.id);

      if (!alreadyExists) {
        // Store the plain product
        state.items.push(product);
      }
    },

    removeFromWishlist: (state, action) => {
      // action.payload is product.id (number/string), not item
      const productId = action.payload;

      state.items = state.items.filter(item => item.id !== productId);
    },
    clearWishlist: state => {
      state.items = [];
    },
  },
});

export const {
  setWishlistItems,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
