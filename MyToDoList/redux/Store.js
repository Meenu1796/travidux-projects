import { configureStore } from '@reduxjs/toolkit'; //creates your Redux store like opening a new database

import { persistStore, persistReducer } from 'redux-persist';
//persistStore- automatically saves changes to device every time todos change
//persistReducer- wraps your reducer with saving/loading ability

import AsyncStorage from '@react-native-async-storage/async-storage';
import todoReducer from '../redux/ToDoSlice';
//AsyncStorage- actual storage on the device; like a key-value database on the phone
//it knows HOW to handle actions like addTodo, toggleTodo, deleteTodo which actually updates the todos array

// key: 'root'  → the name used to save data in AsyncStorage
//                your todos are saved under the key "root"
//                like: AsyncStorage.setItem('persist:root', todosData)
//storage: AsyncStorage → WHERE to save the data
// Tells redux-persist to save todos to device storage (on a phone - AsyncStorage)
// So todos survive app restarts — same effect as SQLite but simpler
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, todoReducer);
// persistReducer WRAPS your todoReducer with extra save/load powers

// WITHOUT persistReducer:          WITH persistReducer:
// ────────────────────────         ────────────────────────────────
// todoReducer handles              todoReducer STILL handles
// addTodo, toggleTodo,             addTodo, toggleTodo, deleteTodo
// deleteTodo                                  +
//                                  AUTO SAVES to AsyncStorage
// Todos lost on app restart ❌     Todos survive app restart ✅

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});
// configureStore creates the actual Redux store — the global storage.

// reducer: persistedReducer
// → tells the store to use your persisted reducer
// → so the store knows how to handle all todo actions
// → AND auto saves every change to AsyncStorage

// middleware: getDefaultMiddleware(...)
// → middleware are functions that run BETWEEN dispatching
//   an action and it reaching the reducer
// → like a security guard that checks every action

// serializableCheck: false
// → redux-persist internally uses non-serializable values
//   (special objects that can't be converted to JSON easily)
// → by default Redux warns about this
// → setting false tells Redux "trust me, it's fine, don't warn"
// → this is always required when using redux-persist

export const persistor = persistStore(store);
// persistStore creates the "persistor" object from your store

// persistor does two things:
// 1. On app START  → reads saved data from AsyncStorage
//                    loads todos back into the store
//                    (this is called "rehydration")

// 2. On every CHANGE → saves updated store to AsyncStorage
//                      automatically, you don't do anything

// This persistor is used in App.js inside PersistGate:
// <PersistGate persistor={persistor}>
//   → PersistGate waits for step 1 (rehydration) to finish
//   → only then shows the app UI
//   → so user never sees an empty list that fills up a second later
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
