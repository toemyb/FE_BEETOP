import api from "./api";

const REST_API_URL = '/api/mau-sac'


export const listMauSac = () => api.get(REST_API_URL)

export const addMausac = (mausac) => api.post("http://localhost:8080/api/mau-sac/them-mausac", mausac)

export const updateMausac = (mausac) => {
  return api.post(`${REST_API_URL}/sua-mausac`, mausac, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);