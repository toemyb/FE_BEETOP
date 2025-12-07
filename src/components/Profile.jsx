import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ManOutlined,
  WomanOutlined
} from '@ant-design/icons';
import { Card, Avatar, Button, Tag, Spin } from 'antd';
import { getAllAddress } from '../service/AddressCustomerService';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Lấy địa chỉ mặc định
    const fetchDefaultAddress = async () => {
      try {
        const customerId = localStorage.getItem("isUser");
        if (customerId) {
          const addresses = await getAllAddress(customerId);
          const addressList = Array.isArray(addresses) ? addresses : addresses?.data || [];
          const defaultAddr = addressList.find(addr => 
            addr.isDefault || addr.diaChiMacDinh || addr.diacChiMacDinh === true
          );
          if (defaultAddr) {
            // Format địa chỉ
            const addressText = [
              defaultAddr.address || defaultAddr.diaChiChiTiet || defaultAddr.diaChi || "",
              defaultAddr.ward || defaultAddr.phuong_xa || "",
              defaultAddr.district || defaultAddr.quan_huyen || "",
              defaultAddr.province || defaultAddr.tinhThanhPho || defaultAddr.tinh_thanh || ""
            ].filter(Boolean).join(", ");
            setDefaultAddress(addressText || "Chưa cập nhật");
          } else {
            setDefaultAddress("Chưa cập nhật");
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy địa chỉ:", error);
        setDefaultAddress("Chưa cập nhật");
      }
    };

    fetchDefaultAddress();
  }, []);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (user?.anh) {
      if (user.anh.startsWith('http')) {
        return user.anh;
      }
      return `http://localhost:8080${user.anh.startsWith('/') ? '' : '/'}${user.anh}`;
    }
    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '24px' }} />
          <h2>Thông tin cá nhân</h2>
          <p style={{ color: '#8c8c8c', fontSize: '16px', marginBottom: '24px' }}>
            Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin cá nhân.
          </p>
          <Button 
            type="primary" 
            size="large"
            onClick={() => navigate('/login')}
            style={{
              padding: '12px 32px',
              height: 'auto',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Header Section với gradient */}
        <Card className="profile-header-card" bordered={false}>
          <div className="profile-header">
            <div className="profile-avatar-section">
              <Avatar
                size={120}
                src={getAvatarUrl()}
                icon={<UserOutlined />}
                className="profile-avatar"
              >
                {!user.anh && getInitials(user.ten)}
              </Avatar>
              <div className="profile-badge">
                <UserOutlined />
              </div>
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{user.ten || 'Người dùng'}</h1>
              <div className="profile-meta">
                <CalendarOutlined style={{ marginRight: '8px' }} />
                <span>Thành viên từ {formatDate(user.ngaySinh) || 'Chưa cập nhật'}</span>
              </div>
              {user.role && (
                <Tag color="blue" style={{ marginTop: '12px', padding: '4px 12px', fontSize: '14px' }}>
                  {user.role}
                </Tag>
              )}
            </div>
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="large"
              className="edit-profile-btn-header"
              onClick={() => navigate('/account')}
            >
              Chỉnh sửa
            </Button>
          </div>
        </Card>

        {/* Thông tin chi tiết */}
        <div className="profile-content">
          <Card className="profile-info-card" title={
            <div className="card-title">
              <UserOutlined />
              <span>Thông tin cá nhân</span>
            </div>
          } bordered={false}>
            <div className="info-grid">
              <div className="info-item">
                <PhoneOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Số điện thoại</div>
                  <div className="info-value">{user.soDienThoai || "Chưa cập nhật"}</div>
                </div>
              </div>

              <div className="info-item">
                <MailOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Email</div>
                  <div className="info-value">{user.email || "Chưa cập nhật"}</div>
                </div>
              </div>

              <div className="info-item">
                {user.gioiTinh === 'Nam' || user.gioiTinh === 'MALE' ? (
                  <ManOutlined className="info-icon-static" />
                ) : user.gioiTinh === 'Nữ' || user.gioiTinh === 'FEMALE' ? (
                  <WomanOutlined className="info-icon-static" />
                ) : (
                  <UserOutlined className="info-icon-static" />
                )}
                <div className="info-details">
                  <div className="info-label">Giới tính</div>
                  <div className="info-value">{user.gioiTinh || "Chưa cập nhật"}</div>
                </div>
              </div>

              <div className="info-item">
                <CalendarOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Ngày sinh</div>
                  <div className="info-value">{formatDate(user.ngaySinh)}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Địa chỉ mặc định */}
          <Card className="profile-info-card" title={
            <div className="card-title">
              <EnvironmentOutlined />
              <span>Địa chỉ mặc định</span>
            </div>
          } bordered={false}>
            <div className="address-section">
              <div className="address-content">
                {defaultAddress ? (
                  <p className="address-text">{defaultAddress}</p>
                ) : (
                  <p className="address-empty">Chưa có địa chỉ mặc định</p>
                )}
              </div>
              <Button
                type="default"
                icon={<EditOutlined />}
                onClick={() => navigate('/account')}
                className="edit-address-btn"
              >
                Quản lý địa chỉ
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
