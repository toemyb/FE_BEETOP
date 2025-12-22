// src/components/CustomerSelector.jsx

import React, { useState } from 'react';
import userService from '../service/userService';

// Layout chung cho Modal
const ModalLayout = ({ title, onClose, children }) => (
  <div
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '8px',
        width: '450px',
        maxWidth: '90%',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      }}
    >
      <h3
        style={{
          borderBottom: '1px solid #eee',
          paddingBottom: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          margin: 0,
        }}
      >
        {title}
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            fontSize: '1.5em',
            cursor: 'pointer',
            color: '#6c757d',
          }}
        >
          &times;
        </button>
      </h3>
      {children}
    </div>
  </div>
);

/**
 * props:
 *  - initialCustomer: khách hàng ban đầu (nếu dùng cho sửa), ở case "thêm nhanh" bạn truyền null
 *  - onClose: đóng modal
 *  - onSaveCustomer: callback sau khi tạo/cập nhật thành công
 *  - walkInOnly: nếu true => chỉ tạo khách vãng lai (không gọi API, không tạo tài khoản)
 */
const CustomerSelector = ({
  initialCustomer,
  onClose,
  onSaveCustomer,
  walkInOnly = false,
}) => {
  // Chuẩn hoá dữ liệu đầu vào
  const initId = initialCustomer?.id ?? initialCustomer?.idTaiKhoan ?? null;
  const initName = initialCustomer?.name ?? initialCustomer?.ten ?? '';
  const initPhone = initialCustomer?.phone ?? initialCustomer?.soDienThoai ?? '';

  const [customerId] = useState(initId);
  const [name, setName] = useState(initName);
  const [phone, setPhone] = useState(initPhone);
  const [loading, setLoading] = useState(false);

  const isEdit = !!customerId;

  const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    borderRadius: '4px',
  };
  const buttonStyle = {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  };

  const handleSave = async () => {
    if (!name || !phone) {
      alert('Vui lòng nhập Họ và tên và Số điện thoại.');
      return;
    }

    // ✅ CASE "THÊM NHANH KHÁCH VÃNG LAI" Ở POS
    if (!isEdit && walkInOnly) {
      const walkInCustomer = {
        id: null,
        idTaiKhoan: null,
        ten: name,
        name,
        soDienThoai: phone,
        phone,
      };

      await Promise.resolve(onSaveCustomer && onSaveCustomer(walkInCustomer));
      return;
    }

    // ✅ Các case còn lại (sửa khách / tạo khách có tài khoản)
    const payload = {
      ten: name,
      soDienThoai: phone,
    };

    try {
      setLoading(true);

      let dataFromApi;
      if (isEdit) {
        // cập nhật khách hàng
        dataFromApi = await userService.updateCustomer(customerId, payload, null);
      } else {
        // tạo khách hàng mới (có tài khoản trong hệ thống)
        dataFromApi = await userService.createCustomer(payload, null);
      }

      // Chuẩn hoá object trả ra cho FE
      const normalized = {
        id: dataFromApi.id ?? dataFromApi.idTaiKhoan ?? customerId,
        idTaiKhoan: dataFromApi.id ?? dataFromApi.idTaiKhoan ?? customerId,
        ten: dataFromApi.ten ?? name,
        name: dataFromApi.ten ?? name,
        soDienThoai: dataFromApi.soDienThoai ?? phone,
        phone: dataFromApi.soDienThoai ?? phone,
      };

      onSaveCustomer(normalized);
    } catch (err) {
      alert(
        typeof err === 'string'
          ? err
          : 'Không thể lưu khách hàng, vui lòng thử lại!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalLayout
      title={isEdit ? 'Cập nhật khách hàng' : 'Thêm khách hàng nhanh'}
      onClose={onClose}
    >
      <div style={{ padding: '15px 0' }}>
        <p style={{ margin: '0 0 5px 0' }}>Họ và tên *</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nhập họ và tên khách hàng"
          style={inputStyle}
        />

        <p style={{ margin: '0 0 5px 0' }}>Số điện thoại *</p>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại"
          style={inputStyle}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '15px',
          borderTop: '1px solid #eee',
          paddingTop: '15px',
        }}
      >
        <button
          onClick={onClose}
          style={{
            ...buttonStyle,
            background: 'white',
            border: '1px solid #ccc',
            color: '#6c757d',
          }}
          disabled={loading}
        >
          Hủy
        </button>
        <button
          onClick={handleSave}
          style={{
            ...buttonStyle,
            backgroundColor: '#20c997',
            color: 'white',
            opacity: loading ? 0.7 : 1,
          }}
          disabled={loading}
        >
          {isEdit ? 'Cập nhật khách hàng' : 'Tạo khách hàng'}
        </button>
      </div>
    </ModalLayout>
  );
};

export default CustomerSelector;
