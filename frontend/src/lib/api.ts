import axios from 'axios';

// Axios instance used across the app.
// Important: we avoid reading/writing tokens from localStorage here for security (XSS risk).
// AuthContext is responsible for managing the access token in memory and setting
// api.defaults.headers.common['Authorization'] when a token is available.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', // default for dev
  withCredentials: true, // ensure HttpOnly refresh cookie is sent on cross-site requests
});

export default api;
