// src/service/OrderManagementService.js
import api from './api';
import { unwrapApi } from './PosOrderService';

const BASE_URL = '/api/order-management/orders';

/**
 * Gọi BE lấy danh sách đơn hàng (trả về ApiResponse<PageResult<OrderListDTO>>)
 * params:
 *  {
 *    keyword,
 *    loaiDon,
 *    trangThaiDon,
 *    trangThaiThanhToan,
 *    fromDate, // 'YYYY-MM-DD'
 *    toDate,   // 'YYYY-MM-DD'
 *    page,     // 0-based
 *    size,
 *    sort      // ví dụ: 'ngayTao,desc' | 'ngayTao,asc'
 *  }
 */
export const searchOrdersRaw = (params = {}) => {
  const {
    keyword,
    loaiDon,
    trangThaiDon,
    trangThaiThanhToan,
    fromDate,
    toDate,
    page = 0,
    size = 10,
    sort = 'ngayTao,desc',
  } = params;

  let sortType = 'newest';
  const lower = sort.toLowerCase();
  if (lower.includes('asc')) {
    sortType = 'oldest';
  } else if (lower.includes('desc')) {
    sortType = 'newest';
  }

  return api.get(BASE_URL, {
    params: {
      keyword: keyword || undefined,
      loaiDon: loaiDon || undefined,
      trangThaiDon: trangThaiDon ?? undefined,
      trangThaiThanhToan: trangThaiThanhToan ?? undefined,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      page,
      size,
      sortType,

      // DÒNG DUY NHẤT BẠN CẦN THÊM – SIÊU QUAN TRỌNG
      trangThaiDonForTaiQuay: [2, 3],   // ĐƠN TẠI QUẦY → CHỈ LẤY ĐƠN HOÀN THÀNH
    },
  });
};
/**
 * Hàm tiện: trả về thẳng PageResult<OrderListDTO> đã unwrap
 */
export const searchOrders = async (params = {}) => {
  const res = await searchOrdersRaw(params);
  return unwrapApi(res); // PageResult<OrderListDTO>
};

export default {
  searchOrdersRaw,
  searchOrders,
};
