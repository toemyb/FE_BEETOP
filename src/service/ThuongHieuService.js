import api from "./api";

const REST_API_URL = '/api/thuong-hieu'


export const listThuongHieu = () => api.get(REST_API_URL)

export const addThuongHieu = (th) => api.post("http://localhost:8080/api/thuong-hieu/them-thuong-hieu", th)

export const updateThuongHieu = (th) => {
  return api.post(`${REST_API_URL}/sua-thuong-hieu`, th, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);