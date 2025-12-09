import api from "./api";

const BASE_URL = "/api/laptop-ct";

// ==================== LIST TẤT CẢ (PAGING) ====================
export const getAllLaptopCT = (page = 1, size = 10) => {
  return api.get(`${BASE_URL}?page=${page}&size=${size}`);
};

// ==================== LIST THEO LAPTOP ====================
export const getLaptopCTByLaptop = (idLaptop) => {
  return api.get(`${BASE_URL}/by-laptop/${idLaptop}`);
};

// ==================== GET DETAIL 1 BIẾN THỂ ====================
export const getLaptopCTDetail = (id) => {
  return api.get(`${BASE_URL}/${id}`);
};

// ==================== ADD BIẾN THỂ (idLaptop nằm trong URL) ====================
export const addLaptopCT = (idLaptop, data) => {
  return api.post(`${BASE_URL}/${idLaptop}`, data, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

// ==================== AUTO GENERATE BIẾN THỂ ====================
export const autoGenerateLaptopCT = (data) => {
  return api.post(`${BASE_URL}/auto-gen`, data, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

// ==================== UPDATE BIẾN THỂ ====================
export const updateLaptopCT = (id, data) => {
  return api.put(`${BASE_URL}/${id}`, data, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

// ==================== UPDATE STATUS ====================
export const updateLaptopCTStatus = (id, status) => {
  return api.put(`${BASE_URL}/${id}/status?status=${status}`);
};
