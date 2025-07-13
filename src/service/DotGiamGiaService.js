import api from "./api";

const REST_API_URL = '/api/dot-giam-gia';


export const listDotGiamGia = () => api.get(REST_API_URL)

export const deactivateDotGiamGia = (dotGiamGiaId) => { return api.put(REST_API_URL + '/ngung-hoat-dong/' + dotGiamGiaId); }

export const getPagedDotGiamGia = (page, size) => api.get(REST_API_URL + '/phan-trang?page=' + page + '&size=' + size);

export const searchDotGiamGia = (keyword) => api.get(`${REST_API_URL}/search?keyword=${keyword}`);

export const filterDotGiamGia = (params) => api.get(REST_API_URL + '/filter', { params: params })
