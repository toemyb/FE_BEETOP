// src/service/OrderTimelineService.js
import api from "./api";
import { unwrapApi } from "./PosOrderService";

const BASE_PATH = "/api/v1/orders";

export const getOrderTimeline = async (orderId) => {
  const res = await api.get(`${BASE_PATH}/${orderId}/timeline`, {
    withCredentials: true,
  });
  return unwrapApi(res);
};

export const updateOrderStatus = async (orderId, payload = {}) => {
  const res = await api.put(`${BASE_PATH}/${orderId}/status`, payload, {
    withCredentials: true,
  });
  return unwrapApi(res);
};



export default { getOrderTimeline, updateOrderStatus };
