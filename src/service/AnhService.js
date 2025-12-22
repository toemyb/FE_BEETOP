import api from "./api";

const REST_API_URL = "/api/anh";

export const getAnhByLaptopCt = (idLaptopCt) =>
  api.get(`${REST_API_URL}/by-laptop-ct/${idLaptopCt}`);

export const uploadAnh = (idLaptopChiTiet, file) => {
  const formData = new FormData();
  formData.append("idLaptopChiTiet", idLaptopChiTiet);
  formData.append("file", file);

  return api.post(`${REST_API_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


export const updateAnh = (id, file, idAnh) => {
  const formData = new FormData();
  formData.append("file", file);

  // optional
  if (idAnh) {
    formData.append("idAnh", idAnh);
  }

  return api.put(`${REST_API_URL}/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};


