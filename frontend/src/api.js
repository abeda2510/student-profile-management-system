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

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.clear();
      const routerBase = import.meta.env.BASE_URL || '/';
      const base = routerBase.endsWith('/') ? routerBase : routerBase + '/';
      window.location.href = base + 'login';
    }
    return Promise.reject(error);
  }
);

// viewUrl — kept for compatibility
export function viewUrl(url) {
  return url;
}

export default api;
