import axios from 'axios';

// Axios instance used across the app.
// Important: we avoid reading/writing tokens from localStorage here for security (XSS risk).
// AuthContext is responsible for managing the access token in memory and setting
// api.defaults.headers.common['Authorization'] when a token is available.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', // default for dev
  withCredentials: true, // ensure HttpOnly refresh cookie is sent on cross-site requests
  timeout: 30000, // 30 second timeout for production
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data || error.message);

    // Enhance error object with more details
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - server may be slow or unreachable';
    }

    return Promise.reject(error);
  }
);

export default api;
