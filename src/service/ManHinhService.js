import api from "./api";

const REST_API_URL = '/api/man-hinh'


export const listManHinh = () => api.get(REST_API_URL)

export const addCpu = (cpu) => api.post("http://localhost:8080/api/man-hinh/them-man-hinh", cpu)

export const updateCpu = (cpu) => {
  return api.post(`${REST_API_URL}/sua-man-hinh`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);