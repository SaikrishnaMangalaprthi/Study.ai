import axios from 'axios';

// Create an Axios instance pointing to the /api prefix
// Vite dev server proxies /api → http://localhost:5000
const api = axios.create({
  baseURL: '/api',
});

// Attach JWT token from localStorage to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_name');
      window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
  }
);

export default api;
