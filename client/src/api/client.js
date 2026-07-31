import axios from 'axios';
import { demoRequest, isDemoApiEnabled } from './demoApi';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const realRequest = apiClient.request.bind(apiClient);

apiClient.request = function demoAwareRequest(config) {
  if (isDemoApiEnabled()) {
    return demoRequest(config);
  }
  return realRequest(config);
};

export default apiClient;
