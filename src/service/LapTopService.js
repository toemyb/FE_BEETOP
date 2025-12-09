import api from "./api";

const REST_API_URL = '/api/laptop'


export const listLaptop = () => api.get(REST_API_URL)

export const addLaptop = (laptop) => api.post("/api/laptop/them-laptop", laptop)

export const updateLaptop = (id,laptop) => {
  return api.post(`${REST_API_URL}/sua-laptop/${id}`, laptop, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);