import api from "./api";

const REST_API_URL = '/api/do-hoa'


export const listDoHoa = () => api.get(REST_API_URL)

export const addDohoa = (dh) => api.post("http://localhost:8080/api/do-hoa/them-do-hoa", dh)

export const updateDohoa = (dh) => {
  return api.post(`${REST_API_URL}/sua-do-hoa`, dh, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);