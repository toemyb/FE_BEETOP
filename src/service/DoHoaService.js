import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/do-hoa'


export const listDoHoa = () => axios.get(REST_API_URL)

export const addDohoa = (dh) => axios.post("http://localhost:8080/api/do-hoa/them-do-hoa", dh)

export const updateDohoa = (dh) => {
  return axios.post(`${REST_API_URL}/sua-do-hoa`, dh, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => axios.get(`${REST_API_URL}/detail/${id}`);