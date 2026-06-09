import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/spm',
  timeout: 60000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// viewUrl — kept for compatibility
export function viewUrl(url) {
  return url;
}

export default api;
