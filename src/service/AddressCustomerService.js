import axios from "axios";

const BASEURL = 'http://localhost:8080';
const REST_API_URL = '/api/v1/laptops/address';

// Lấy tất cả địa chỉ của khách hàng
export const getAllAddress = async (customerId) => {
    try {
        const response = await axios.get(`${BASEURL}/api/v1/laptops/get-all-address/${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi lấy danh sách địa chỉ:", error);
        throw error;
    }
};

// Thêm địa chỉ mới
export const addAddress = async (address) => {
    try {
        const response = await axios.post(`${BASEURL}${REST_API_URL}/add`, address, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi thêm địa chỉ:", error);
        throw error;
    }
};

// Cập nhật địa chỉ
export const updateAddress = async (id, address) => {
    try {
        const response = await axios.put(`${BASEURL}${REST_API_URL}/update/${id}`, address, {
            headers: {
                "Content-Type": "application/json"
            }
        });
        return response.data;
    } catch (error) {
        console.error("Lỗi khi cập nhật địa chỉ:", error);
        throw error;
    }
};

// Đặt địa chỉ mặc định
export const setDefaultAddress = async (id) => {
    try {
        const response = await axios.put(`${BASEURL}${REST_API_URL}/set-default/${id}`, {});
        return response.data;
    } catch (error) {
        console.error("Lỗi khi đặt địa chỉ mặc định:", error);
        throw error;
    }
};

// Xóa địa chỉ
export const deleteAddress = async (id) => {
    try {
        const response = await axios.delete(`${BASEURL}${REST_API_URL}/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi xóa địa chỉ:", error);
        throw error;
    }
};