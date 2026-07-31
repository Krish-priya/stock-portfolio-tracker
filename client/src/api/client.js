import axios from 'axios';
import { demoRequest, isDemoApiEnabled } from './demoApi';

const defaultAdapter = axios.getAdapter(['xhr', 'http', 'fetch']);

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  adapter: async (config) => {
    if (isDemoApiEnabled()) {
      try {
        const result = await demoRequest(config);
        return {
          data: result.data,
          status: result.status || 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {},
        };
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return defaultAdapter(config);
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
