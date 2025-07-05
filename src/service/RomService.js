import api from "./api";

const REST_API_URL = '/api/rom'


export const listRom = () => api.get(REST_API_URL)

export const addRom = (rom) => api.post("http://localhost:8080/api/rom/them-rom", rom)

export const updateRom = (rom) => {
  return api.post(`${REST_API_URL}/sua-rom`, rom, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);