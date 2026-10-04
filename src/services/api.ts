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

// The admin console and the customer storefront keep independent sessions, so
// each section reads its own token. Admin pages (`/admin/*`) use the admin
// token; everything else uses the customer token.
export const getActiveToken = (): string | null =>
  window.location.pathname.startsWith('/admin')
    ? localStorage.getItem('admin_token')
    : localStorage.getItem('token');

// Attach the section's token to every request. An explicit Authorization
// header (e.g. one-off profile bootstrap) is never overridden.
api.interceptors.request.use((config) => {
  if (config.headers.Authorization) return config;

  const token = getActiveToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;