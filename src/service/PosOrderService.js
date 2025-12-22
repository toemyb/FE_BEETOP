import api from './api';

export const unwrapApi = (res) => {
  if (res && res.data && typeof res.data === 'object') {
    // ApiResponse<T> { code, message, data }
    if (res.data.data !== undefined) return res.data.data;
  }
  return res?.data;
};

const BASE_URL = '/api/pos/orders';

// 1. Tạo đơn nháp (POST /api/pos/orders)
export const createDraftOrder = (payload) => api.post(BASE_URL, payload);

// 2. Lấy chi tiết đơn (GET /api/pos/orders/{orderId})
export const getOrderDetail = (orderId) =>
  api.get(`${BASE_URL}/${orderId}`);

// 3. Thêm Seri vào đơn (POST /api/pos/orders/{orderId}/items)
export const addItemsToOrder = (orderId, seriIds) =>
  api.post(`${BASE_URL}/${orderId}/items`, { seriIds });

// 4. Xoá 1 dòng Seri (DELETE /api/pos/orders/{orderId}/items/{orderCtId})
export const removeItemFromOrder = (orderId, orderCtId) =>
  api.delete(`${BASE_URL}/${orderId}/items/${orderCtId}`);

// 5. Chọn/đổi khách hàng (PUT /api/pos/orders/{orderId}/customer)
export const selectCustomerForOrder = (orderId, payload) =>
  api.put(`${BASE_URL}/${orderId}/customer`, payload);

// 6. Áp voucher (POST /api/pos/orders/{orderId}/voucher)
export const applyVoucherForOrder = (orderId, voucherIds) =>
  api.post(`${BASE_URL}/${orderId}/voucher`, { voucherIds });

// 7. Thêm thanh toán (POST /api/pos/orders/{orderId}/payments)
export const addPaymentToOrder = (orderId, payload) =>
  api.post(`${BASE_URL}/${orderId}/payments`, payload);

// 8. Hoàn tất đơn (POST /api/pos/orders/{orderId}/complete)
export const completeOrder = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/complete`);

// 9. Huỷ đơn (POST /api/pos/orders/{orderId}/cancel)
export const cancelOrder = (orderId) =>
  api.post(`${BASE_URL}/${orderId}/cancel`);

// 10. Tạo link VNPay
export const startVnpayPayment = (orderId) =>
  api.post(`/api/pos/orders/${orderId}/pay/vnpay`);

// 11. Tạo link MoMo
export const startMomoPayment = (orderId) =>
  api.post(`/api/pos/orders/${orderId}/pay/momo`);

export const addItemsBySeriCode = (orderId, seriCodes) =>
  api.post(`/api/pos/orders/${orderId}/items/by-seri-code`, seriCodes);