// Axios instance for the extension.
// Key difference from client2: uses Bearer-only auth (no cookies) and reads
// tokens from chrome.storage.local instead of localStorage.

import axios from 'axios';
import environmentConfig from './environment.js';
import { get, KEYS } from './storage.js';

const API = axios.create({
  baseURL: environmentConfig.apiUrl,
  timeout: 10000,
  headers: environmentConfig.getDefaultHeaders(),
  withCredentials: false, // Extensions can't share cookies with the web domain
});

// Request interceptor: attach Bearer token from chrome.storage
API.interceptors.request.use(
  async (config) => {
    try {
      const token = await get(KEYS.ACCESS_TOKEN);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Storage access may fail during extension startup
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: log auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      console.warn('[ShelfQuest Extension] 401 — token may be expired');
    } else if (status === 403) {
      console.warn('[ShelfQuest Extension] 403 — forbidden');
    }
    return Promise.reject(error);
  },
);

export default API;
