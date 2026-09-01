import axios from 'axios';
import { updateAccessToken, updateRefreshToken } from '../services/tokenService';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://jua-lern.onrender.com/api/',
});

const isAuthenticationRequest = (url = '') => /(?:^|\/)token\/?$|token\/refresh\/?$|auth\/admin-login\/?$/.test(String(url));

api.interceptors.request.use(
  (config) => {
    if (isAuthenticationRequest(config.url)) {
      delete config.headers?.Authorization;
      return config;
    }
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // A rejected login is an expected response, not an expired authenticated
    // request. Let each login form show its own clear credentials error instead
    // of trying to refresh an old token and redirecting away from the form.
    const isLoginRequest = isAuthenticationRequest(originalRequest?.url);

    if (error.response?.status === 401 && !isLoginRequest && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/'}token/refresh/`, {
          refresh: refreshToken,
        });

        updateAccessToken(response.data.access);
        updateRefreshToken(response.data.refresh ?? refreshToken);

        api.defaults.headers.common.Authorization = `Bearer ${response.data.access}`;
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
