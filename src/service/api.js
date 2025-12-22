import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor để xử lý lỗi 401 và làm mới token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Chỉ xử lý lỗi 401 cho các request không phải là refresh token
    if (error.response?.status === 401 && !originalRequest._retry && 
        !originalRequest.url.includes('/auth/refresh')) {
      originalRequest._retry = true;
      
      try {
        const response = await axios.post(
          'http://localhost:8080/auth/refresh',
          {},
          { 
            withCredentials: true,
            
          }
        );
        
        const { accessToken, refreshToken } = response.data.data;
        
        // Lưu token mới vào sessionStorage của tab hiện tại
        sessionStorage.setItem('accessToken', accessToken);
        sessionStorage.setItem('refreshToken', refreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Xử lý lỗi refresh token
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('refreshToken');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;