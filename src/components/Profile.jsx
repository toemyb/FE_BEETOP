// src/components/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      console.log('User data:', parsedUser); // Kiểm tra trong console
      setUser(parsedUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return <div>Đang tải thông tin...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      <h2>Thông tin cá nhân</h2>
      <div style={{
        background: '#f5f5f5',
        padding: 20,
        borderRadius: 8,
        marginTop: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
          <img
            src={user.anh || '/default-avatar.png'}
            alt="Avatar"
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              objectFit: 'cover',
              marginRight: 20
            }}
            onError={(e) => { e.target.onerror = null; e.target.src = '/default-avatar.png'; }} // fallback local ảnh nếu ảnh user lỗi
          />
          <div>
            <h3>{user.ten || 'Không có tên'}</h3>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Email:</strong> {user.email || 'Không có email'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Số điện thoại:</strong> {user.soDienThoai || 'Không có số'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Giới tính:</strong> {user.gioiTinh || 'Không xác định'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Ngày sinh:</strong> {user.ngaySinh || 'Không có ngày'}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Chức vụ:</strong> {user.role || 'Không có vai trò'}
        </div>
      </div>
    </div>
  );
};

export default Profile;