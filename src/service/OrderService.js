// OrderService.js
import api from "./api"; // ✅ axios instance của bạn (có interceptor/token)

const BASEURL = "/api/v1/laptops";

// Lấy danh sách đơn hàng theo id tài khoản
export const getOrdersByCustomerId = async (customerId) => {
  try {
    const response = await api.get(`${BASEURL}/order/list/${customerId}`);
    // ✅ nếu BE trả ApiResponse { data: ... } thì lấy data bên trong
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đơn hàng:", error);
    throw error;
  }
};

// Lấy chi tiết sản phẩm của đơn hàng
export const getOrderProducts = async (orderId) => {
  try {
    const response = await api.get(`${BASEURL}/order/${orderId}/products`);
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết sản phẩm đơn hàng:", error);
    throw error;
  }
};

// Tìm kiếm đơn hàng theo mã đơn hàng và số điện thoại
export const searchOrder = async (maDonHang, sdt) => {
  try {
    const response = await api.post(`${BASEURL}/order/search`, {
      maDonHang: maDonHang || "",
      sdt: sdt || "",
    });
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Lỗi khi tìm kiếm đơn hàng:", error);
    throw error;
  }
};

// Hủy đơn hàng
export const cancelOrder = async (idOrder, idTaiKhoan) => {
  try {
    const response = await api.put(`${BASEURL}/order/${idOrder}/cancel`, null, {
      params: { idTaiKhoan },
    });
    return response.data?.data ?? response.data;
  } catch (error) {
    console.error("Lỗi khi hủy đơn hàng:", error);
    throw error;
  }
};
