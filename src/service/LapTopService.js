import api from "./api";
import axios from "axios";
const REST_API_URL = '/api/laptop'
const BASEURL = 'http://localhost:8080';

export const listLaptop = () => api.get(REST_API_URL)

export const addLaptop = (laptop) => api.post("/api/laptop/them-full", laptop)

export const updateCpu = (cpu) => {
  return api.post(`${REST_API_URL}/sua-cpu`, cpu, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const CustomerLaptopList = async () => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/home`);
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi lấy danh sách laptop:", error);
    throw error;
  }
};
export const CustomerLaptopDetail = async (id) => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/${id}/details`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy chi tiết laptop:", error);
    throw error;
    
  }
}
export const checkQuantityProduct = async (id , quantity) => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/check-quantity/${id}?quantity=${quantity}`);
    return response.data;   
  } catch (error) {
    console.error("Lỗi khi kiểm tra số lượng sản phẩm:", error);
    throw error;
  }
}
export const listProductDetail = async () => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/list-product-customer`);
    return response.data;   
  } catch (error) {
    console.error("Lỗi khi lấy danh sách chi tiết sản phẩm:", error);
    throw error;
  }
}
export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);

  export const searchLaptops = async (keyword) => {
    try {
      const response = await axios.get(`${BASEURL}/api/v1/laptops/search`, {
        params: { keyword }
      });
      return response.data; 
    } catch (error) {
      console.error("Lỗi khi tìm kiếm laptop:", error);
      throw error;
    }
  };
export const filterLaptops = async (filters) => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/filter`, {
      params: filters
    });
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi lọc laptop:", error);
    throw error;
  }   
};
export const getAllBrand = async () => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/get-all-brand`);
    return response.data; 
  }
  catch (error) {
    console.error("Lỗi khi lấy danh sách thương hiệu:", error);
    throw error;
  }
}
export const searchBrand = async (idBrand) => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/search-brand`, {
      params: { idBrand }
    });
    return response.data; 
  } catch (error) {
    console.error("Lỗi khi tìm kiếm laptop theo thương hiệu:", error);
    throw error;
  }
};
