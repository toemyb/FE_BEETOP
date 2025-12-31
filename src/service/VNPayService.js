import axios from "axios";
const BASEURL = 'http://localhost:8080/api/v1/laptops';

export const createVNPayPayment = async (paymentData) => {
    try {
        const response = await axios.post(`${BASEURL}/vnpay/create-payment`, paymentData);
        return response.data;
    } catch (error) {
        console.error("Lỗi khi tạo thanh toán VNPay:", error);
        throw error;
    }
};




















