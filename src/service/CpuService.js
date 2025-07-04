import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/cpu'


export const listCpu = () => axios.get(REST_API_URL)

export const addCpu = (cpu) => axios.post("http://localhost:8080/api/cpu/them-cpu", cpu)

export const updateCpu = (cpu) => {
  return axios.post(`${REST_API_URL}/sua-cpu`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);