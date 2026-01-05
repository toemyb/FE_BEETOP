// src/service/ghnApi.js
import axios from "axios";

// ✅ Đặt token GHN của bạn ở đây (hoặc dùng env: import.meta.env.VITE_GHN_TOKEN)
const GHN_TOKEN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";

export const ghnApi = axios.create({
  baseURL: "https://online-gateway.ghn.vn/shiip/public-api",
  headers: {
    token: GHN_TOKEN,
  },
});

export const getGHNProvinces = async () => {
  const res = await ghnApi.get("/master-data/province");
  return res.data?.data || [];
};

export const getGHNDistricts = async (provinceId) => {
  if (!provinceId) return [];
  const res = await ghnApi.get("/master-data/district", {
    params: { province_id: provinceId },
  });
  return res.data?.data || [];
};

export const getGHNWards = async (districtId) => {
  if (!districtId) return [];
  const res = await ghnApi.get("/master-data/ward", {
    params: { district_id: districtId },
  });
  return res.data?.data || [];
};
