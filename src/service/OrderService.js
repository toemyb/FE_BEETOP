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

