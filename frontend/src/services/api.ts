import axios from 'axios';

const productionApiUrl = 'https://belen-production-0486.up.railway.app/api';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || (import.meta.env.PROD ? productionApiUrl : 'http://localhost:3001/api')
});

api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem('silcar_user');
  if (savedUser) {
    const user = JSON.parse(savedUser);
    config.headers['x-user-id'] = user.id;
    config.headers['x-user-role'] = user.role;
    if (user.machine?.id) {
      config.headers['x-machine-id'] = user.machine.id;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
