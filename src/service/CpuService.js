import api from './api';

const REST_API_URL = '/api/cpu';


export const listCpu = () => api.get(REST_API_URL)

export const addCpu = (cpu) => api.post("http://localhost:8080/api/cpu/them-cpu", cpu)

export const updateCpu = (cpu) => {
  return api.post(`${REST_API_URL}/sua-cpu`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);