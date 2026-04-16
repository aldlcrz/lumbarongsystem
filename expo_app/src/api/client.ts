import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../../constants/Config';

const apiClient = axios.create({
  baseURL: API_CONFIG.getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['x-auth-token'] = token; // Compatibility with both backend formats
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear token and potentially trigger a logout if we had access to context here
      // But we'll handle this in the AuthContext.
      console.warn('Unauthorized request - session may have expired.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
