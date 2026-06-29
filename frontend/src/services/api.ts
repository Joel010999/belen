import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
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
