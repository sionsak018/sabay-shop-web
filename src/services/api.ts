import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// Warm up the API connection before the first request fires, since the
// free-tier backend pays a visible cost for TLS/DNS setup.
if (apiBaseUrl) {
  try {
    const origin = new URL(apiBaseUrl, window.location.origin).origin;
    if (origin !== window.location.origin) {
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = origin;
      preconnect.crossOrigin = '';
      document.head.appendChild(preconnect);
    }
  } catch {
    // ignore malformed VITE_API_BASE_URL
  }
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Accept': 'application/json',
  },
});

// Attach token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;