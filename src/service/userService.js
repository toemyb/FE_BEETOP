import api from './api';

const userService = {
  getUsersByRole: async (roleId) => {
    try {
      const response = await api.get(`/api/admin/users/by-role/${roleId}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể tải danh sách tài khoản!';
    }
  },

  

  createEmployee: async (data, avatarFile) => {
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (data[key]) {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) {
        formData.append('anh', avatarFile);
      }
      const response = await api.post('/api/admin/users/create-employee', formData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
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
        if (data[key]) {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) {
        formData.append('anh', avatarFile);
      }
      const response = await api.post('/api/admin/users/create-customer', formData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
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
        if (data[key] && key !== 'anh') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) {
        formData.append('anh', avatarFile);
      }
      const response = await api.put(`/api/admin/users/update-employee/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
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
        if (data[key] && key !== 'anh') {
          formData.append(key, data[key]);
        }
      });
      if (avatarFile) {
        formData.append('anh', avatarFile);
      }
      const response = await api.put(`/api/admin/users/update-customer/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể cập nhật tài khoản khách hàng!';
    }
  },

  
  

  toggleUserStatus: async (id) => {
    try {
      const response = await api.patch(`/api/admin/users/${id}/status`, null, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể chuyển trạng thái tài khoản!';
    }
  },

  getUserDetail: async (id) => {
    try {
      const response = await api.get(`/api/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${sessionStorage.getItem('accessToken')}` },
      });
      return response.data.data;
    } catch (error) {
      throw error.response?.data?.message || 'Không thể lấy thông tin tài khoản!';
    }
  },
};

export default userService;