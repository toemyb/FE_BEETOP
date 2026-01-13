// src/service/userService.js
import api from './api';

const userService = {
  // ===== QUẢN LÝ TÀI KHOẢN (giữ nguyên như cũ) =====
  getUsersByRole: async (roleId) => {
    try {
      const response = await api.get(`/api/admin/users/by-role/${roleId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách tài khoản!';
    }
  },

  createEmployee: async (data, avatarFile) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) formData.append('anh', avatarFile);

      const response = await api.post('/api/admin/users/create-employee', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tạo tài khoản nhân viên!';
    }
  },

  createCustomer: async (data, avatarFile) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) formData.append('anh', avatarFile);

      const response = await api.post('/api/admin/users/create-customer', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tạo tài khoản khách hàng!';
    }
  },

  updateEmployee: async (id, data, avatarFile) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '' && key !== 'anh') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) formData.append('anh', avatarFile);

      const response = await api.put(`/api/admin/users/update-employee/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể cập nhật tài khoản nhân viên!';
    }
  },

  updateCustomer: async (id, data, avatarFile) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined && data[key] !== '' && key !== 'anh') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) formData.append('anh', avatarFile);

      const response = await api.put(`/api/admin/users/update-customer/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể cập nhật tài khoản khách hàng!';
    }
  },

  toggleUserStatus: async (id) => {
    try {
      const response = await api.patch(`/api/admin/users/${id}/status`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể chuyển trạng thái tài khoản!';
    }
  },

  getUserDetail: async (id) => {
    try {
      const response = await api.get(`/api/admin/users/${id}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể lấy thông tin tài khoản!';
    }
  },
updateAdmin: async (id, data, avatarFile) => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '' && key !== 'anh') {
        formData.append(key, data[key]);
      }
    });
    if (avatarFile) formData.append('anh', avatarFile);

    const response = await api.put(`/api/admin/users/update-admin/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể cập nhật tài khoản admin!';
  }
},

updateUserByAdmin: async (id, data, avatarFile) => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '' && key !== 'anh') {
        formData.append(key, data[key]);
      }
    });
    if (avatarFile) formData.append('anh', avatarFile);

    const response = await api.put(`/api/admin/users/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể cập nhật tài khoản!';
  }
},
  // ===== CẬP NHẬT PROFILE KHÁCH HÀNG (giữ nguyên) =====
  updateCustomerAccount: async (data) => {
  try {
    const response = await api.put(`/api/v1/laptops/account/update`, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể cập nhật tài khoản!';
  }
},

 updateCustomerAccountForm: async (data, avatarFile) => {
  try {
    const formData = new FormData();
    Object.keys(data || {}).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    if (avatarFile) formData.append('anh', avatarFile);

    const response = await api.put(`/api/v1/laptops/account/update-form`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể cập nhật (form-data)!';
  }
},


  // ===== MỚI: QUẢN LÝ ĐỊA CHỈ KHÁCH HÀNG (CHO POS GIAO HÀNG NHANH) =====
getAddressesByCustomer: async (taiKhoanId) => {
  try {
    const response = await api.get(`/api/admin/address/customer/${taiKhoanId}`);
    return response.data.data || [];
  } catch (error) {
    throw error.response?.data?.message || 'Không thể tải danh sách địa chỉ!';
  }
},

createAddressForCustomer: async (data) => {
  try {
    const response = await api.post('/api/admin/address/create', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể tạo địa chỉ mới!';
  }
},

updateAddressForCustomer: async (addressId, data) => {
  try {
    const response = await api.put(`/api/admin/address/update/${addressId}`, data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể cập nhật địa chỉ!';
  }
},

setDefaultAddress: async (addressId) => {
  try {
    const response = await api.patch(`/api/admin/address/default/${addressId}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || 'Không thể đặt địa chỉ mặc định!';
  }
},

createAdmin: async (data, avatarFile) => {
  try {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    if (avatarFile) formData.append("anh", avatarFile);

    // ⚠️ đổi đúng endpoint controller của bạn (ví dụ create-admin)
    const response = await api.post("/api/admin/users/create-admin", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  } catch (error) {
    throw error.response?.data?.message || "Không thể tạo tài khoản admin!";
  }
},

deleteAddress: async (addressId) => {
  try {
    await api.delete(`/api/admin/address/delete/${addressId}`);
  } catch (error) {
    throw error.response?.data?.message || 'Không thể xóa địa chỉ!';
  }
},
};

export default userService;