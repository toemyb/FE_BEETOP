// CartCustomerService.js
import api from "./api"; // axios instance của bạn (có interceptor + token)

const BASEURL = "/api/v1/laptops";

// ✅ CartPage đang dùng tên checkInvoitory (giữ nguyên để khỏi lỗi import)
export const checkInvoitory = (id) => {
  return api.get(`${BASEURL}/check-inventory/${id}`);
};

export const addToCart = async (cartItem) => {
  try {
    const res = await api.post(`${BASEURL}/cart/add`, cartItem);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
    throw error;
  }
};

export const getCartItems = async (customerId) => {
  try {
    const res = await api.get(`${BASEURL}/cart/${customerId}`);
    return res.data;
  } catch (error) {
    // ✅ BE trả 404 khi user chưa có cart => coi như cart trống
    if (error?.response?.status === 404) {
      return { sanPhams: [], tongSoLuong: 0 };
    }
    console.error("Lỗi khi lấy danh sách giỏ hàng:", error);
    throw error;
  }
};
export const updateCartItem = async (cartItem) => {
  try {
    const payload = {
      idGioHangCT: cartItem.idGioHangCT,
      soLuong: cartItem.soLuong ?? cartItem.quantity, // ✅ dùng soLuong cho BE
    };

    const res = await api.put(`${BASEURL}/cart/update-cart-quantity`, payload);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm trong giỏ hàng:", error);
    throw error;
  }
};

export const removeCartItem = async (cartItemId) => {
  try {
    const res = await api.delete(`${BASEURL}/cart/remove/${cartItemId}`);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    const res = await api.post(`${BASEURL}/order/create`, orderData);
    return res.data;
  } catch (error) {
    console.error("Lỗi khi tạo đơn hàng:", error);
    throw error;
  }
};
