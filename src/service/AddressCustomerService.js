import api from "./api";

// Lấy tất cả địa chỉ của khách hàng (customer endpoint)
export const getAllAddress = async (customerId) => {
  const res = await api.get(`/api/v1/laptops/get-all-address/${customerId}`);
  // tuỳ BE trả thẳng list hay bọc data
  return res.data?.data ?? res.data ?? [];
};

// Thêm địa chỉ mới
export const addAddress = async (address) => {
  const res = await api.post(`/api/v1/laptops/address/add`, address);
  return res.data?.data ?? res.data;
};

// Cập nhật địa chỉ
export const updateAddress = async (id, address) => {
  const res = await api.put(`/api/v1/laptops/address/update/${id}`, address);
  return res.data?.data ?? res.data;
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (id) => {
  const res = await api.put(`/api/v1/laptops/address/set-default/${id}`, {});
  return res.data?.data ?? res.data;
};

// Xóa địa chỉ
export const deleteAddress = async (id) => {
  const res = await api.delete(`/api/v1/laptops/address/delete/${id}`);
  return res.data?.data ?? res.data;
};
