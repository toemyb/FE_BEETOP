import api from "./api";
import axios from "axios";
const REST_API_URL = '/api/laptop'
const BASEURL = 'http://localhost:8080';

export const listLaptop = () => api.get(REST_API_URL)

export const addLaptop = (laptop) => api.post("/api/laptop/them-laptop", laptop)

export const updateLaptop = (id,laptop) => {
  return api.post(`${REST_API_URL}/sua-laptop/${id}`, laptop, {
    headers: {
      "Content-Type": "application/json"
    }
  });
};

export const getAllById = (id) => api.get(`${REST_API_URL}/detail/${id}`);

//----Code huy------/
export const CustomerLaptopList = async () => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/home`);
    // Normalize dữ liệu để tương thích với ProductCard
    const normalizedData = response.data.map(item => ({
      ...item,
      memory: item.meMoRy || item.memory || item.ram || '',
      laptopID: item.laptopID || item.laptopId || item.id,
    }));
    return normalizedData; 
  } catch (error) {
    console.error("Lỗi khi lấy danh sách laptop:", error);
    throw error;
  }
};

export const CustomerLatestLaptopList = async () => {
  try {
    const response = await axios.get(`${BASEURL}/api/v1/laptops/latest`);
    // Normalize dữ liệu để tương thích với ProductCard
    const normalizedData = response.data.map(item => ({
      ...item,
      memory: item.meMoRy || item.memory || item.ram || '',
      laptopID: item.laptopID || item.laptopId || item.id,
    }));
    return normalizedData; 
  } catch (error) {
    console.error("Lỗi khi lấy danh sách laptop mới nhất:", error);
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

// Kiểm tra xem sản phẩm có còn variant nào còn hàng không (trangThaiSeri === 1)
export const checkProductHasAvailableVariants = async (laptopId) => {
  try {
    const variants = await CustomerLaptopDetail(laptopId);
    return variants.some(variant => variant.trangThaiSeri === 1);
  } catch (error) {
    console.error(`Lỗi khi kiểm tra variants của sản phẩm ${laptopId}:`, error);
    return false;
  }
}

// Lọc danh sách sản phẩm, chỉ giữ lại những sản phẩm có ít nhất 1 variant còn hàng
export const filterAvailableProducts = async (products) => {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const checkPromises = products.map(async (product) => {
    const laptopId = product.laptopID || product.laptopId || product.id;
    if (!laptopId) return false;
    
    const hasAvailable = await checkProductHasAvailableVariants(laptopId);
    return hasAvailable ? product : null;
  });

  const results = await Promise.all(checkPromises);
  return results.filter(product => product !== null);
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