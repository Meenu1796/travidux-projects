// api/API.js ✅ FIXED VERSION

import axios from 'axios';
import { Platform } from 'react-native';
import { store } from '../store/redux/Store'; // Redux store

// Base URL
export const BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api'
    : 'http://localhost:8000/api';

// reate axios instance FIRST
const api = axios.create({
  baseURL: BASE_URL,
});

//THEN add interceptor (after api is defined)
api.interceptors.request.use(
  config => {
    const token = store.getState().auth.token;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

export default api;
