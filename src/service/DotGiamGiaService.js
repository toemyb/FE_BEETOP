import axios from "axios";

const REST_API_URL = 'http://localhost:8080/api/dot-giam-gia';


export const listDotGiamGia = () => axios.get(REST_API_URL)

export const deactivateDotGiamGia = (dotGiamGiaId) => { return axios.put(REST_API_URL + '/ngung-hoat-dong/' + dotGiamGiaId); }

export const getPagedDotGiamGia = (page, size) => axios.get(REST_API_URL + '/phan-trang?page=' + page + '&size=' + size);

export const searchDotGiamGia = (keyword) => axios.get(`${REST_API_URL}/search?keyword=${keyword}`);

export const filterDotGiamGia = (params) => axios.get(REST_API_URL + '/filter', { params: params })
