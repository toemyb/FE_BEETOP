// src/components/Profile.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      // If user data is not found, redirect to login page
      navigate('/login');
    }
  }, [navigate]);

  if (!user) return <div>Đang tải thông tin...</div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}> {/* Added padding for better spacing */}
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
          />
          <div>
            <h3>{user.ten}</h3>
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Tên đăng nhập:</strong> {user.tenDangNhap}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Email:</strong> {user.email}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Số điện thoại:</strong> {user.soDienThoai}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Giới tính:</strong> {user.gioiTinh}
        </div>
        <div style={{ marginBottom: 10 }}>
          <strong>Ngày sinh:</strong> {user.ngaySinh}
        </div>
        <div style={{ marginBottom: 10 }}>
          {/* Changed user.tenChucVu to user.role */}
          <strong>Chức vụ:</strong> {user.role}
        </div>
      </div>
    </div>
  );
};

export default Profile;