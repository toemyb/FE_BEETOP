import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/laptop'


export const listLaptop = () => axios.get(REST_API_URL)

export const addLaptop = (laptop) => axios.post("http://localhost:8080/api/laptop/them-full", laptop)

export const updateCpu = (cpu) => {
  return axios.post(`${REST_API_URL}/sua-cpu`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);