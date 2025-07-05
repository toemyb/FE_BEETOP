import api from "./api";

const REST_API_URL = '/api/phieu-giam-gia'


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