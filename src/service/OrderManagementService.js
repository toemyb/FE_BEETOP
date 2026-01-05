// src/service/OrderManagementService.js
import api from "./api";
import { unwrapApi } from "./PosOrderService";

const BASE_URL = "/api/order-management/orders";

export const searchOrdersRaw = (params = {}) => {
  const {
    keyword,
    loaiDon,
    trangThaiDon,
    trangThaiThanhToan,
    trangThaiDonForTaiQuay, // ✅ nhận từ caller (optional)
    fromDate,
    toDate,
    page = 0,
    size = 10,
    sort = "ngayTao,desc",
  } = params;

  let sortType = "newest";
  const lower = sort.toLowerCase();
  if (lower.includes("asc")) sortType = "oldest";

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

      // ✅ chỉ gửi khi có
      trangThaiDonForTaiQuay: trangThaiDonForTaiQuay?.length
        ? trangThaiDonForTaiQuay
        : undefined,
    },
  });
};

export const searchOrders = async (params = {}) => {
  const res = await searchOrdersRaw(params);
  return unwrapApi(res);
};

export default { searchOrdersRaw, searchOrders };
