import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Transform Cloudinary URL to open PDFs inline in browser instead of downloading
export function viewUrl(url) {
  if (!url) return url;
  // For Cloudinary raw PDFs, insert fl_inline transformation
  if (url.includes('res.cloudinary.com') && url.includes('/raw/upload/')) {
    return url.replace('/raw/upload/', '/raw/upload/fl_inline/');
  }
  return url;
}

export default api;
