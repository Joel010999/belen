import axios from 'axios';
import { normalizeRole } from '../utils/authRole';

const productionApiUrl = 'https://belen-production-0486.up.railway.app/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiUrl : 'http://localhost:3001/api')
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('silcar_user');
  if (savedUser) {
    try {
      const user = JSON.parse(savedUser);
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

export default api;
