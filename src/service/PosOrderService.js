import api from "./api";

export const unwrapApi = (res) => {
  if (res?.data && typeof res.data === "object" && "data" in res.data) {
    return res.data.data; // ApiResponse<T> { code, message, data }
  }
  return res?.data;
};

const BASE_URL = "/api/pos/orders";
const GHN_URL = "/api/pos/ghn";

// 1. Tạo đơn nháp
export const createDraftOrder = (payload) => api.post(BASE_URL, payload);

// 2. Lấy chi tiết đơn
export const getOrderDetail = (orderId) => api.get(`${BASE_URL}/${orderId}`);

// 3. Thêm Seri vào đơn
export const addItemsToOrder = (orderId, seriIds) =>
  api.post(`${BASE_URL}/${orderId}/items`, { seriIds });

// 4. Xoá 1 dòng Seri
export const removeItemFromOrder = (orderId, orderCtId) =>
  api.delete(`${BASE_URL}/${orderId}/items/${orderCtId}`);

// 5. Chọn/đổi khách hàng
export const selectCustomerForOrder = (orderId, payload) =>
  api.put(`${BASE_URL}/${orderId}/customer`, payload);

// 5.1 Cập nhật giao hàng + phí ship + địa chỉ snapshot
export const updateShipping = async (orderId, payload) => {
  // payload phải match PosUpdateShippingRequest
  const body = {
    giaoHang: payload.giaoHang,              // Boolean
    // phiVanChuyen: payload.phiVanChuyen,   // ❌ không cần gửi, BE tự tính
    hoTen: payload.hoTen,
    soDienThoai: payload.soDienThoai,

    diaChiChiTiet: payload.diaChiChiTiet,
    quocGia: payload.quocGia,
    tinhThanh: payload.tinhThanh,
    quanHuyen: payload.quanHuyen,
    phuongXa: payload.phuongXa,

    provinceId: payload.provinceId,
    districtId: payload.districtId,
    wardCode: payload.wardCode,

    idDiaChi: payload.idDiaChi,
    saveAddress: payload.saveAddress,
    setAsDefault: payload.setAsDefault,

    // ✅ NEW theo BE
    useInsurance: payload.useInsurance,
  };

  return api.put(`${BASE_URL}/${orderId}/shipping`, body);

};


// 6. Áp voucher
export const applyVoucherForOrder = (orderId, voucherId) =>
  api.post(`${BASE_URL}/${orderId}/voucher`, { voucherId });

export const clearVoucherForOrder = (orderId) =>
  api.delete(`${BASE_URL}/${orderId}/voucher`);

// 7. Thêm thanh toán
export const addPaymentToOrder = (orderId, payload) =>
  api.post(`${BASE_URL}/${orderId}/payments`, payload);

// 8. Hoàn tất đơn
export const completeOrder = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/complete`);

// 9. Huỷ đơn
export const cancelOrder = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/cancel`);

// 10. Tạo link VNPay
export const startVnpayPayment = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/pay/vnpay`);

// 11. Tạo link MoMo
export const startMomoPayment = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/pay/momo`);

// Quét QR: thêm sản phẩm bằng mã seri (body là mảng string)
export const addItemsBySeriCode = (orderId, seriCodes) =>
  api.post(`${BASE_URL}/${orderId}/items/by-seri-code`, seriCodes);

// ======================
// GHN PROXY (POS)
// ======================
export const ghnGetProvinces = () => api.get(`${GHN_URL}/province`);

export const ghnGetDistricts = (provinceId) =>
  api.get(`${GHN_URL}/district`, { params: { province_id: provinceId } });

export const ghnGetWards = (districtId) =>
  api.get(`${GHN_URL}/ward`, { params: { district_id: districtId } });

export const ghnCalcFee = (payload) => api.post(`${GHN_URL}/fee`, payload);
