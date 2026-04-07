import axios from 'axios';
import { BASE_URL } from './API';

const api = axios.create({ baseURL: BASE_URL });
const authHeader = token => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchCart = async token =>
  (await api.get('/cart/', authHeader(token))).data;
export const addToCart = async (data, token) =>
  (await api.post('/cart/', data, authHeader(token))).data;
export const removeFromCart = async (id, token) =>
  await api.delete(`/cart/${id}/`, authHeader(token));
export const fetchWishlist = async token =>
  (await api.get('/wishlist/', authHeader(token))).data;
export const addToWishlist = async (data, token) =>
  (await api.post('/wishlist/', data, authHeader(token))).data;
export const removeFromWishlist = async (id, token) =>
  await api.delete(`/wishlist/${id}/`, authHeader(token));
