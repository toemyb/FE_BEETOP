import api from "./api";

const REST_API_URL = 'http://localhost:8080/api/ram'


export const listRam = () => api.get(REST_API_URL)

export const addRam = (ram) => api.post("http://localhost:8080/api/ram/them-ram", ram)

export const updateRam = (ram) => {
  return api.post(`${REST_API_URL}/sua-ram`, ram, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);