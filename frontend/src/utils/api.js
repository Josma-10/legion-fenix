import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://legion-fenix-fc.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('fenix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== 'undefined' &&
      error.response &&
      error.response.status === 401 &&
      !window.location.pathname.includes('/login')
    ) {
      localStorage.removeItem('fenix_token');
      localStorage.removeItem('fenix_user');
    }
    return Promise.reject(error);
  }
);

export default api;
