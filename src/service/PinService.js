import api from "./api";

const REST_API_URL = '/api/pin'


export const listPin = () => api.get(REST_API_URL)

export const addPin = (pin) => api.post("http://localhost:8080/api/pin/them-pin", pin)

export const updatePin = (pin) => {
  return api.post(`${REST_API_URL}/sua-pin`, pin, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);