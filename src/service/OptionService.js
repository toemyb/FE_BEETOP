import api from "./api";

const BASE_URL = '/api';

export const getAllDoHoa = () => {
  return api.get(`${BASE_URL}/do-hoa`);
};

export const getAllRam = () => {
  return api.get(`${BASE_URL}/ram`);
};

export const getAllRom = () => {
  return api.get(`${BASE_URL}/rom`);
};

export const getAllCpu = () => {
  return api.get(`${BASE_URL}/cpu`);
};

export const getAllManHinh = () => {
  return api.get(`${BASE_URL}/man-hinh`);
};

export const getAllPin = () => {
  return api.get(`${BASE_URL}/pin`);
};
export const getAllHeDieuHanh = () => {
    return api.get(`${BASE_URL}/he-dieu-hanh`);
  };
  
  export const getAllMauSac = () => {
    return api.get(`${BASE_URL}/mau-sac`);
  };

  export const getAllKichThuoc = () => {
    return api.get(`${BASE_URL}/kich-thuoc`);
  };