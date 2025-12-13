import axios from "axios";
const BASEURL = "http://localhost:8080/api/v1/laptops";

const assertId = (id, name) => {
  if (!id || id === "null" || id === "undefined") {
    throw new Error(`${name} is missing`);
  }
};

export const addToCart = async (cartItem) => {
  try {
    // ✅ Validate bắt buộc đúng field BE
    assertId(cartItem?.idTaiKhoan, "idTaiKhoan");
    assertId(cartItem?.idSpct, "idSpct");

    // ✅ Default soLuong để tránh null (BE thường yêu cầu >0)
    const payload = {
      ...cartItem,
      soLuong: cartItem?.soLuong && cartItem.soLuong > 0 ? cartItem.soLuong : 1,
    };

    console.log("[addToCart] payload:", payload);

    const response = await axios.post(`${BASEURL}/cart/add`, payload);
    return response.data;
  } catch (error) {
    const beMsg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error.response.data : "") ||
      "";

    console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", {
      status: error?.response?.status,
      data: error?.response?.data,
      beMsg,
      payload: cartItem,
    });
    throw error;
  }
};

export const getCartItems = async (customerId) => {
  try {
    if (!customerId || customerId === "null" || customerId === "undefined") {
      throw new Error("customerId is missing");
    }
    const response = await axios.get(`${BASEURL}/cart/${customerId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách giỏ hàng:", error);
    throw error;
  }
};

export const updateCartItem = async (cartItem) => {
  try {
    // (tuỳ chọn) validate nhẹ
    // assertId(cartItem?.idGioHangCT, "idGioHangCT");
    const response = await axios.put(`${BASEURL}/cart/update-cart-quantity`, cartItem);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật sản phẩm trong giỏ hàng:", error);
    throw error;
  }
};

export const removeCartItem = async (cartItemId) => {
  try {
    assertId(cartItemId, "cartItemId");
    const response = await axios.delete(`${BASEURL}/cart/remove/${cartItemId}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
    throw error;
  }
};

export const createOrder = async (orderData) => {
  try {
    // ✅ validate cơ bản (tránh gửi rỗng)
    if (!orderData || !orderData.idTaiKhoan) {
      throw new Error("orderData or idTaiKhoan is missing");
    }

    console.log("[createOrder] payload:", orderData);

    const response = await axios.post(`${BASEURL}/order/create`, orderData);
    return response.data;
  } catch (error) {
    const beMsg =
      error?.response?.data?.message ||
      (typeof error?.response?.data === "string" ? error.response.data : "") ||
      "";

    console.error("Lỗi khi tạo đơn hàng:", {
      status: error?.response?.status,
      data: error?.response?.data,
      beMsg,
    });
    throw error;
  }
};
