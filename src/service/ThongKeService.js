import api from './api';

const BASE_URL = '/api/thong-ke';

export const getThongKeTongQuan = (params) => {
  return api.get(`${BASE_URL}/tong-quan`, { params });
};

// Thống kê 12 tháng so sánh 2 năm
export const getThongKe12Thang = (nam1, nam2) => {
  return api.get(`${BASE_URL}/nam`, {
    params: {
      nam1: nam1,
      nam2: nam2
    }
  });
};

// Thống kê theo ngày so sánh 2 tháng
export const getThongKeTheoThang = (nam1, thang1, nam2, thang2) => {
  return api.get(`${BASE_URL}/thang`, {
    params: {
      nam1: nam1,
      thang1: thang1,
      nam2: nam2,
      thang2: thang2
    }
  });
};

// Thống kê so sánh 2 ngày
export const getThongKeSoSanhHaiNgay = (ngay1, ngay2) => {
  return api.get(`${BASE_URL}/ngay`, {
    params: {
      ngay1: ngay1.format('YYYY-MM-DD'),
      ngay2: ngay2.format('YYYY-MM-DD')
    }
  });
};

// Thống kê đơn hàng theo trạng thái
export const getThongKeTrangThai = () => {
  return api.get(`${BASE_URL}/trang-thai`);
};

// Thống kê truy cập (online/offline users)
export const getThongKeTruyCap = () => {
  return api.get(`${BASE_URL}/truy-cap`);
};

// Lấy top 10 laptop theo tháng
export const getTopLaptopTheoThang = (year, month) => {
  return api.get(`${BASE_URL}/top-laptop/thang`, {
    params: {
      year: year,
      month: month
    }
  });
};

// ====== KHÁCH HÀNG ======
export const getThongKeKhachHangTong = () => {
  return api.get(`${BASE_URL}/khach-hang/tong`);
};

export const getThongKeKhachHangSoDon = () => {
  return api.get(`${BASE_URL}/khach-hang/so-don`);
};
