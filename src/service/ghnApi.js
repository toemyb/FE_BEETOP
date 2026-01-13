// src/service/ghnApi.js
import api from "./api";

// ✅ Provinces
export const getGHNProvinces = async () => {
  // CartPage có unwrapList() nên trả thẳng res hoặc res.data đều được,
  // nhưng trả res.data sẽ gọn hơn
  const res = await api.get("/api/v1/ghn/province");
  return res?.data; // KHÔNG ép [] ở đây
};

// ✅ Districts
export const getGHNDistricts = async (provinceId) => {
  if (!provinceId) return [];
  const res = await api.get("/api/v1/ghn/district", {
    params: { province_id: provinceId },
  });
  return res?.data;
};

// ✅ Wards
export const getGHNWards = async (districtId) => {
  if (!districtId) return [];
  const res = await api.get("/api/v1/ghn/ward", {
    params: { district_id: districtId },
  });
  return res?.data;
};

// ✅ Fee
export const calcGhnFee = async (payload) => {
  const res = await api.post("/api/v1/ghn/fee", payload);

  // BE có thể trả: {total}, {data:{total}}, {data:{data:{total}}}, {data:{Data:{total}}}...
  const total =
    res?.data?.total ??
    res?.data?.data?.total ??
    res?.data?.data?.data?.total ??
    res?.data?.Data?.total ??
    res?.data?.data?.Data?.total ??
    0;

  return Number(total || 0);
};
