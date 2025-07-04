import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/ram'


export const listRam = () => axios.get(REST_API_URL)

export const addRam = (ram) => axios.post("http://localhost:8080/api/ram/them-ram", ram)

export const updateRam = (ram) => {
  return axios.post(`${REST_API_URL}/sua-ram`, ram, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);