// src/service/SeriService.js
import api from "./api";

const REST_API_URL = "/api/seri";

// Lấy danh sách seri theo idLaptopCt
export const getSeriByLaptopCt = (idLaptopCt) =>
  api.get(`${REST_API_URL}/by-laptop-ct/${idLaptopCt}`);

// Thêm list seri cho 1 laptopCt
// dto = { idLaptopCt, list: [ { idSeri, trangThai }, ... ] }
export const addListSeri = (dto) =>
  api.post(`${REST_API_URL}/them-list`, dto);

// Cập nhật 1 seri
// dto = SeriUpdateRequestDTO
export const updateSeri = (dto) =>
  api.put(`${REST_API_URL}/update`, dto);

// Lấy tất cả seri
export const getAllSeri = () =>
  api.get(`${REST_API_URL}/all`);

// Lấy chi tiết 1 seri theo id
export const getSeriDetail = (id) =>
  api.get(`${REST_API_URL}/detail/${id}`);
