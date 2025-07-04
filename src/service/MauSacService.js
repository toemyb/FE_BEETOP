import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/mau-sac'


export const listMauSac = () => axios.get(REST_API_URL)

export const addMausac = (mausac) => axios.post("http://localhost:8080/api/mau-sac/them-mausac", mausac)

export const updateMausac = (mausac) => {
  return axios.post(`${REST_API_URL}/sua-mausac`, mausac, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);