import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/man-hinh'


export const listManHinh = () => axios.get(REST_API_URL)

export const addCpu = (cpu) => axios.post("http://localhost:8080/api/man-hinh/them-man-hinh", cpu)

export const updateCpu = (cpu) => {
  return axios.post(`${REST_API_URL}/sua-man-hinh`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);