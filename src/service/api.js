// src/service/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // để cookie refresh hoạt động
});

// ✅ Request interceptor: gắn accessToken nếu có
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor: refresh khi 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || "";

    // Không xử lý nếu:
    // - không phải 401
    // - đã retry rồi
    // - hoặc request đang là refresh
    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      url.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Gọi refresh bằng axios thường để tránh interceptor loop
      const refreshRes = await axios.post(
        "http://localhost:8080/auth/refresh",
        {},
        { withCredentials: true }
      );

      // ✅ Hỗ trợ nhiều format response (tránh undefined)
      const tokenInfo =
        refreshRes.data?.meta?.tokenInfo ||
        refreshRes.data?.data?.tokenInfo ||
        refreshRes.data?.data ||
        refreshRes.data?.meta ||
        {};

      const accessToken = tokenInfo.accessToken;
      const refreshToken = tokenInfo.refreshToken;

      if (!accessToken) {
        // Không lấy được accessToken => logout
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Lưu token mới
      sessionStorage.setItem("accessToken", accessToken);
      if (refreshToken) sessionStorage.setItem("refreshToken", refreshToken);

      // Gắn token mới và retry request cũ
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      // Refresh fail => logout
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  }
);

export default api;
