import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/rom'


export const listRom = () => axios.get(REST_API_URL)

export const addRom = (rom) => axios.post("http://localhost:8080/api/rom/them-rom", rom)

export const updateRom = (rom) => {
  return axios.post(`${REST_API_URL}/sua-rom`, rom, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);