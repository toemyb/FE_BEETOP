// src/service/SeriService.js
import api from "./api";

const REST_API_URL = "/api/seri";


///------------
export const extractBeMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.title ||
    error?.response?.data?.data?.message ||
    ""
  );
};

/**
 * Lấy danh sách seri theo idLaptopCt
 */
export const getSeriByLaptopCt = (idLaptopCt) =>
  api.get(`${REST_API_URL}/by-laptop-ct/${idLaptopCt}`);

/**
 * Thêm list seri cho 1 laptopCt
 * dto = { idLaptopCt, list: [ { idSeri, trangThai }, ... ] }
 */
export const addListSeri = (dto) =>
  api.post(`${REST_API_URL}/them-list`, dto);

/**
 * Cập nhật 1 seri
 * dto = SeriUpdateRequestDTO
 */
export const updateSeri = (dto) =>
  api.put(`${REST_API_URL}/update`, dto);

/**
 * Lấy tất cả seri
 */
export const getAllSeri = () =>
  api.get(`${REST_API_URL}/all`);

/**
 * Lấy chi tiết 1 seri theo id
 */
export const getSeriDetail = (id) =>
  api.get(`${REST_API_URL}/detail/${id}`);

/**
 * Lấy theo idSeri (string)
 */
export const getSeriByIdSeri = (idSeri) =>
  api.get(`${REST_API_URL}/by-id-seri/${encodeURIComponent(idSeri)}`);

/**
 * ✅ Check tồn tại seri (dùng để validate trước khi thêm ở FE)
 * Bạn cần có endpoint BE tương ứng:
 * GET /api/seri/exists?idSeri=XXXX
 * Trả về: true/false hoặc ApiResponse{data:true/false}
 */
export const checkSeriExists = (idSeri) =>
  api.get(`${REST_API_URL}/exists`, {
    params: { idSeri },
  });
