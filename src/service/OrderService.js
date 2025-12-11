import axios from "axios";
const BASEURL = 'http://localhost:8080/api/v1/laptops';

// Lấy danh sách đơn hàng theo id tài khoản
export const getOrdersByCustomerId = async (customerId) => {
    try {
        const response = await axios.get(`${BASEURL}/order/list/${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đơn hàng:", error);
        throw error;
    }
};

// Lấy chi tiết sản phẩm của đơn hàng
export const getOrderProducts = async (orderId) => {
    try {
        const response = await axios.get(`${BASEURL}/order/${orderId}/products`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy chi tiết sản phẩm đơn hàng:", error);
        throw error;
    }
};

// Tìm kiếm đơn hàng theo mã đơn hàng và số điện thoại
export const searchOrder = async (maDonHang, sdt) => {
    try {
        const response = await axios.post(`${BASEURL}/order/search`, {
            maDonHang: maDonHang || "",
            sdt: sdt || ""
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tìm kiếm đơn hàng:", error);
        throw error;
    }
};

// Hủy đơn hàng
export const cancelOrder = async (idOrder, idTaiKhoan) => {
    try {
        const response = await axios.put(`${BASEURL}/order/${idOrder}/cancel`, null, {
            params: { idTaiKhoan }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi hủy đơn hàng:", error);
        throw error;
    }
};

