import api from "./api"; // axios instance của bạn

export const createVNPayPayment = (payload) => {
  // payload: { idOrder, amount, orderInfo?, orderType?, bankCode? }
  return api.post("/api/v1/laptops/vnpay/create-payment", payload);
};
