import axios from 'axios';
import { BASE_URL } from './API';

const api = axios.create({ baseURL: BASE_URL });
const authHeader = token => ({
  headers: { Authorization: `Bearer ${token}` },
});

export const fetchOrders = async token =>
  (await api.get('/orders/', authHeader(token))).data;
export const placeOrder = async (data, token) =>
  (await api.post('/orders/', data, authHeader(token))).data;
