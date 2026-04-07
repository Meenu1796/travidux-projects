//It stores products and lets you filter them (like search).
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  filteredProducts: [],
  loading: false,
};
// | Field              | Purpose                      |
// | ------------------ | ---------------------------- |
// | `products`         | All products from API        |
// | `filteredProducts` | Products after search/filter |
// | `loading`          | API loading state            |

const productsSlice = createSlice({
  name: 'products', //Creates a Redux slice called "products"
  initialState,
  reducers: {
    setProducts: (state, action) => {
      state.products = action.payload;
      state.filteredProducts = action.payload;
      //Saves all products from API
      // Also copies them into filteredProducts
      // So initially:
      // products === filteredProducts
    },
    filterProducts: (state, action) => {
      const query = action.payload.toLowerCase();
      state.filteredProducts = state.products.filter(product =>
        product.name.toLowerCase().includes(query),
      );
      // Takes a search keyword (like "shoe")
      // Filters products by name
      // Updates filteredProducts
    },
  },
});

export const { setProducts, filterProducts } = productsSlice.actions;
export default productsSlice.reducer;
