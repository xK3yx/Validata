import axios from 'axios';
import { getClientId } from '../utils/clientId';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000, // 90s — compare runs 2 AI calls in parallel
});

// Every request carries this browser's id; the server scopes history and the
// daily limit to it.
api.interceptors.request.use(config => {
  config.headers['X-Client-ID'] = getClientId();
  return config;
});

// Intercept responses to normalise error messages
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 404 && !err.response?.data?.error) {
      // API route not found — server likely not running or needs restart
      err.response.data = {
        error: 'Cannot reach the server. Make sure it is running (npm run dev) and restart if needed.',
      };
    }
    return Promise.reject(err);
  }
);

export default api;
