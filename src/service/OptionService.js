import api from "./api";

const BASE_URL = '/api';

export const getAllDoHoa = () => {
  return api.get(`${BASE_URL}/do-hoa/trang-thai`);
};

export const getAllRam = () => {
  return api.get(`${BASE_URL}/ram/trang-thai`);
};

export const getAllRom = () => {
  return api.get(`${BASE_URL}/rom/trang-thai`);
};

export const getAllCpu = () => {
  return api.get(`${BASE_URL}/cpu/trang-thai`);
};

export const getAllManHinh = () => {
  return api.get(`${BASE_URL}/man-hinh/trang-thai`);
};

export const getAllPin = () => {
  return api.get(`${BASE_URL}/pin/trang-thai`);
};
export const getAllHeDieuHanh = () => {
    return api.get(`${BASE_URL}/he-dieu-hanh/trang-thai`);
  };
  
  export const getAllMauSac = () => {
    return api.get(`${BASE_URL}/mau-sac/trang-thai`);
  };

  export const getAllKichThuoc = () => {
    return api.get(`${BASE_URL}/kich-thuoc/trang-thai`);
  };
    export const getAllThuongHieu = () => {
    return api.get(`${BASE_URL}/thuong-hieu/trang-thai`);
  };