import axios from "axios";
const BASEURL = 'http://localhost:8080/api/v1/laptops';
export const checkInvoitory = (id) => {
    return axios.get(`${BASEURL}/check-inventory/${id}`);
};
export const addToCart = async (cartItem) => {
    try {
        const response = await axios.post(`${BASEURL}/cart/add`, cartItem);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm vào giỏ hàng:", error);
        throw error;
    }

};
export const getCartItems = async (customerId) => {
    try {
        const response = await axios.get(`${BASEURL}/cart/${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách giỏ hàng:", error);
        throw error;
    }
};
export const updateCartItem = async (cartItem) => {
    try {
        const response = await axios.put(`${BASEURL}/cart/update-cart-quantity`, cartItem);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật sản phẩm trong giỏ hàng:", error);
        throw error;
    }
};
export const removeCartItem = async (cartItemId) => {
    try {
        const response = await axios.delete(`${BASEURL}/cart/remove/${cartItemId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm khỏi giỏ hàng:", error);
        throw error;
    }
};

export const createOrder = async (orderData) => {
    try {
        const response = await axios.post(`${BASEURL}/order/create`, orderData);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo đơn hàng:", error);
        throw error;
    }
};

