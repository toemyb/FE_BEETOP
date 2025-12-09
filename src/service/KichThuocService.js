import api from "./api";

const REST_API_URL = '/api/kich-thuoc'


export const listKichthuoc = () => api.get(REST_API_URL)

export const addKichthuoc = (kt) => api.post("http://localhost:8080/api/kich-thuoc/them-kich-thuoc", kt)

export const updateKichthuoc = (kt) => {
  return api.post(`${REST_API_URL}/sua-kich-thuoc`, kt, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);