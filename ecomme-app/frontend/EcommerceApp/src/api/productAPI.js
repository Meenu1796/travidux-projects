import axios from 'axios';
import { BASE_URL } from '../api/API';

const api = axios.create({ baseURL: BASE_URL });

const authHeader = (token, isFormData = false) => ({
  headers: {
    Authorization: `Bearer ${token}`,
    ...(isFormData && {
      'Content-Type': 'multipart/form-data',
    }),
  },
});

api.interceptors.request.use(req => {
  console.log('API CALL:', req.baseURL + req.url);
  return req;
});

// ── Public ──────────────────────────────────────────────────────────────────
// ✅ Correct endpoints

export const fetchProducts = async () =>
  (await api.get('/products/products/')).data;

export const fetchProduct = async id =>
  (await api.get(`/products/products/${id}/`)).data;

export const fetchCategories = async () =>
  (await api.get('/products/categories/')).data;

export const fetchBanners = async () =>
  (await api.get('/products/banners/')).data;

export const fetchBestSellers = async () =>
  (await api.get('/products/best-sellers-list/')).data;

export const filterByCategory = async id =>
  (await api.get(`/products/products/?category=${id}`)).data;

export const fetchRecentlyViewed = async token =>
  (await api.get('/products/recently-viewed/', authHeader(token))).data;

//export const fetchProducts = async () => (await api.get('/products/')).data;
// export const fetchProduct = async id =>
//   (await api.get(`/products/${id}/`)).data;
//export const fetchCategories = async () => (await api.get('/categories/')).data;
export const fetchFeatured = async () =>
  (await api.get('/products/featured/')).data;
// export const fetchBestSellers = async () =>
//   (await api.get('/products/best-sellers/')).data;
// export const fetchBanners = async () => (await api.get('/banners/')).data;
export const searchProducts = async q =>
  (await api.get(`/products/?search=${q}`)).data;
// export const filterByCategory = async id =>
//   (await api.get(`/products/?category=${id}`)).data;

// ── Auth required ────────────────────────────────────────────────────────────
// export const fetchRecentlyViewed = async token =>
//   (await api.get('/recently-viewed/', authHeader(token))).data;

export const addRecentlyViewed = async (productId, token) =>
  (await api.post(`/recently-viewed/${productId}/`, {}, authHeader(token)))
    .data;

// ── Admin ────────────────────────────────────────────────────────────────────
export const createProduct = async (data, token) =>
  (await api.post('/products/', data, authHeader(token))).data;

export const updateProduct = async (id, data, token) =>
  (await api.patch(`/products/${id}/`, data, authHeader(token))).data;

export const deleteProduct = async (id, token) =>
  await api.delete(`/products/${id}/`, authHeader(token));

//admin
export const createCategory = async (formData, token) => {
  const response = await api.post(`/products/categories/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const updateCategoryApi = async (id, formData, token) => {
  const res = await api.put(`/products/categories/${id}/`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};
