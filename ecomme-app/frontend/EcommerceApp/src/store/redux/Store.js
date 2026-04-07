import { configureStore } from '@reduxjs/toolkit'; //creates your Redux store like opening a new database
import { combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

//persistStore- automatically saves changes to device every time todos change
//persistReducer- wraps your reducer with saving/loading ability
import authReducer from '../slices/authSlice';
import productsReducer from '../slices/productsSlice';
import wishlistReducer from '../slices/wishlistSlice';
import cartReducer from '../slices/cartSlice';
import categoryReducer from '../slices/categorySlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'wishlist', 'cart'],
};

const rootReducer = combineReducers({
  auth: authReducer,
  products: productsReducer,
  wishlist: wishlistReducer,
  cart: cartReducer,
  categories: categoryReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);

//---------------------------------------------------------
// App opens
//     ↓
// PersistGate waits...
//     ↓
// persistor reads AsyncStorage → loads saved todos into store
//     ↓
// App UI renders with existing todos ✅

// User adds a todo
//     ↓
// dispatch(addTodo(newTodo))
//     ↓
// middleware processes action
//     ↓
// persistedReducer updates store
//     ↓
// persistor AUTO SAVES to AsyncStorage ✅

// App closes and reopens
//     ↓
// Same cycle — todos are still there ✅
