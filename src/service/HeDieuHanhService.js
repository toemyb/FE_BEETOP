import api from "./api";

const REST_API_URL = '/api/he-dieu-hanh'


export const listHeDieuHanh = () => api.get(REST_API_URL)

export const addHeDieuHanh = (hdh) => api.post("http://localhost:8080/api/he-dieu-hanh/them-he-dieu-hanh", hdh)

export const updateHeDieuHanh = (hdh) => {
  return api.post(`${REST_API_URL}/sua-he-dieu-hanh`, hdh, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);