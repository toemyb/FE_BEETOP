import api from "./api";
import axios from "axios";
const REST_API_URL = '/api/phieu-giam-gia'
const BASEURL = 'http://localhost:8080';
export const listVouchers = () => api.get(REST_API_URL)

export const addEmployee = (voucher) => api.post(REST_API_URL, voucher)

export const getVoucher = (voucherId) => api.get(REST_API_URL + '/' + voucherId)

export const updateVoucher = (voucherId, voucher) => api.post(REST_API_URL + '/' + voucherId, voucher)

export const deleteVoucher = (voucherId) => api.delete(REST_API_URL + '/' + voucherId)

export const searchVoucher = (keyword) => api.get(REST_API_URL + '/search?p=' + keyword);

export const filterVouchers = (params) => api.get(REST_API_URL + '/filter', { params: params })

export const getPagedVouchers = (page, size) => api.get(REST_API_URL + '/phan-trang?page=' + page + '&size=' + size);

export const checkMaTrung = (ma) => {return api.get(REST_API_URL + '/check-ma?ma=' + ma);};

export const deactivateVoucher = (voucherId) => { return api.put(REST_API_URL + '/ngung-hoat-dong/' + voucherId);}

export const getVoucherForBill = async (total) => {
    try {
        const response = await axios.get(`${BASEURL}/api/v1/laptops/get-voucher?tongTien=${total}`);
        return response.data;
    }catch (error) {
        console.error("Lỗi khi lấy voucher cho hóa đơn:", error);
        throw error;
    }
    
}