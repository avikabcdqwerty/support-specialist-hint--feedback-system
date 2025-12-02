import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create an Axios instance for API communication
const api: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:4000/api',
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor for logging and error handling
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Optionally add more logging or headers here
    return config;
  },
  (error) => {
    // eslint-disable-next-line no-console
    console.error('API request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    // eslint-disable-next-line no-console
    if (error.response) {
      console.error(
        `API response error: ${error.response.status} - ${error.response.data?.error || error.message}`
      );
    } else {
      console.error('API response error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;