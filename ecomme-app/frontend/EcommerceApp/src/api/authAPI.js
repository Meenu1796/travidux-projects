import axios from 'axios';
import { BASE_URL } from './API';

const api = axios.create({ baseURL: BASE_URL });

// Register new user
export const registerAPI = async data => {
  const res = await api.post('/auth/register/', data);
  return res.data;
};

// Login user → returns { user, access, refresh }
export const loginAPI = async data => {
  const res = await api.post('/auth/login/', data);
  return res.data;
};

// Get logged in user profile
export const profileAPI = async token => {
  const res = await api.get('/auth/profile/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
