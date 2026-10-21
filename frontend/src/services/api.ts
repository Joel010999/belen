import axios from 'axios';
import { normalizeRole } from '../utils/authRole';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:3001/api' : '/api')
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('silcar_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
      if (user.token) {
        config.headers['Authorization'] = `Bearer ${user.token}`;
      }
      config.headers['x-user-id'] = user.id;
      config.headers['x-user-role'] = normalizeRole(user.role);
      if (user.machine?.id) {
        config.headers['x-machine-id'] = user.machine.id;
      }
    } catch {
      localStorage.removeItem('silcar_user');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('silcar_user');
      if (window.location.pathname !== '/login' && !window.location.pathname.includes('login')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
