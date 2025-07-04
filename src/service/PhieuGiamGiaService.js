import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/phieu-giam-gia'


export const listVouchers = () => axios.get(REST_API_URL)

export const addEmployee = (voucher) => axios.post(REST_API_URL, voucher)

export const getVoucher = (voucherId) => axios.get(REST_API_URL + '/' + voucherId)

export const updateVoucher = (voucherId, voucher) => axios.post(REST_API_URL + '/' + voucherId, voucher)

export const deleteVoucher = (voucherId) => axios.delete(REST_API_URL + '/' + voucherId)

export const searchVoucher = (keyword) => axios.get(REST_API_URL + '/search?p=' + keyword);

export const filterVouchers = (params) => axios.get(REST_API_URL + '/filter', { params: params })

export const getPagedVouchers = (page, size) => axios.get(REST_API_URL + '/phan-trang?page=' + page + '&size=' + size);

export const checkMaTrung = (ma) => {return axios.get(REST_API_URL + '/check-ma?ma=' + ma);};

export const deactivateVoucher = (voucherId) => { return axios.put(REST_API_URL + '/ngung-hoat-dong/' + voucherId);}