import api from "./api";

const REST_API_URL = "/api/phieu-giam-gia";

export const listVouchers = () => api.get(REST_API_URL);
export const addEmployee = (voucher) => api.post(REST_API_URL, voucher);
export const getVoucher = (voucherId) => api.get(`${REST_API_URL}/${voucherId}`);
export const updateVoucher = (voucherId, voucher) => api.post(`${REST_API_URL}/${voucherId}`, voucher);
export const deleteVoucher = (voucherId) => api.delete(`${REST_API_URL}/${voucherId}`);
export const searchVoucher = (keyword) => api.get(`${REST_API_URL}/search`, { params: { p: keyword } });
export const filterVouchers = (params) => api.get(`${REST_API_URL}/filter`, { params });
export const getPagedVouchers = (page, size) => api.get(`${REST_API_URL}/phan-trang`, { params: { page, size } });
export const checkMaTrung = (ma) => api.get(`${REST_API_URL}/check-ma`, { params: { ma } });
export const deactivateVoucher = (voucherId) => api.put(`${REST_API_URL}/ngung-hoat-dong/${voucherId}`);

// ✅ FIX: dùng api + params, không dùng axios/BASEURL
export const getVoucherForBill = async (total) => {
  try {
    const res = await api.get("/api/v1/laptops/get-voucher", {
      params: { tongTien: total },
    });
    return res.data;
  } catch (error) {
    console.error("Lỗi khi lấy voucher cho hóa đơn:", error);
    throw error;
  }
};
