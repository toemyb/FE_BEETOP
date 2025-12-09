// src/service/HinhThucThanhToanService.js
import api from './api';

// Sửa lại path cho đúng controller của bạn nếu khác
export const listPaymentMethods = () =>
  api.get('/api/hinh-thuc-thanh-toan');
