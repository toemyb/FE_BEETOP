import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

export const getAllDoHoa = () => {
  return axios.get(`${BASE_URL}/do-hoa`);
};

export const getAllRam = () => {
  return axios.get(`${BASE_URL}/ram`);
};

export const getAllRom = () => {
  return axios.get(`${BASE_URL}/rom`);
};

export const getAllCpu = () => {
  return axios.get(`${BASE_URL}/cpu`);
};

export const getAllManHinh = () => {
  return axios.get(`${BASE_URL}/man-hinh`);
};

export const getAllPin = () => {
  return axios.get(`${BASE_URL}/pin`);
};
export const getAllHeDieuHanh = () => {
    return axios.get(`${BASE_URL}/he-dieu-hanh`);
  };
  
  export const getAllMauSac = () => {
    return axios.get(`${BASE_URL}/mau-sac`);
  };

  export const getAllKichThuoc = () => {
    return axios.get(`${BASE_URL}/kich-thuoc`);
  };