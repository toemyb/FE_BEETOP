import React, { useState, useEffect } from 'react';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  EditOutlined
} from '@ant-design/icons';
import { Card, Avatar, Spin } from 'antd';
import './CustomerInfoCard.css';

const CustomerInfoCard = ({ orders = [] }) => {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy thông tin khách hàng từ sessionStorage
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCustomerInfo(parsedUser);
      } catch (error) {
        console.error("Lỗi khi parse thông tin khách hàng:", error);
      }
    }
    setLoading(false);
  }, []);

  // Tính tổng đơn hàng và tổng tiền chi tiêu
  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => sum + (order.tongTienThuHo || 0), 0);

  // Format ngày tham gia (lấy từ ngày tạo đơn hàng đầu tiên hoặc ngày hiện tại)
  const joinedDate = React.useMemo(() => {
    if (orders.length > 0) {
      const firstOrder = orders[orders.length - 1]; // Đơn hàng cũ nhất
      if (firstOrder.ngayTao) {
        const date = new Date(firstOrder.ngayTao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }
    }
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }, [orders]);

  const formatPrice = (price) => {
    return `${(price || 0).toLocaleString("vi-VN")} ₫`;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="customer-info-card-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!customerInfo) {
    return (
      <div className="customer-info-card-wrapper">
        <Card className="customer-info-card">
          <div className="customer-info-empty">
            <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <p style={{ color: '#8c8c8c', fontSize: '16px' }}>Chưa có thông tin khách hàng</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="customer-info-card-wrapper">
      <Card className="customer-info-card" bordered={false}>
        {/* Header đơn giản */}
        <div className="customer-card-header-simple">
          <Avatar
            size={64}
            src={customerInfo.anh ? (
              customerInfo.anh.startsWith('http') 
                ? customerInfo.anh 
                : `http://localhost:8080${customerInfo.anh.startsWith('/') ? '' : '/'}${customerInfo.anh}`
            ) : null}
            icon={<UserOutlined />}
            className="customer-avatar-simple"
          >
            {!customerInfo.anh && getInitials(customerInfo.ten)}
          </Avatar>
          <div className="customer-header-info-simple">
            <h3 className="customer-name-simple">{customerInfo.ten || "Khách hàng"}</h3>
            <div className="customer-meta-simple">
              Thành viên từ {joinedDate}
            </div>
          </div>
        </div>

        {/* Thông tin liên hệ đơn giản */}
        <div className="customer-contact-section-simple">
          <div className="info-item-simple">
            <PhoneOutlined className="info-icon-simple" />
            <div className="info-content-simple">
              <div className="info-label-simple">Số điện thoại</div>
              <div className="info-value-simple">{customerInfo.soDienThoai || "Chưa cập nhật"}</div>
            </div>
          </div>

          <div className="info-item-simple">
            <MailOutlined className="info-icon-simple" />
            <div className="info-content-simple">
              <div className="info-label-simple">Email</div>
              <div className="info-value-simple">{customerInfo.email || "Chưa cập nhật"}</div>
            </div>
          </div>
        </div>

        {/* Thống kê đơn giản */}
        <div className="customer-stats-section-simple">
          <div className="stat-item-simple">
            <ShoppingOutlined className="stat-icon-simple" />
            <div className="stat-content-simple">
              <div className="stat-value-simple">{totalOrders}</div>
              <div className="stat-label-simple">Tổng đơn hàng</div>
            </div>
          </div>

          <div className="stat-item-simple">
            <DollarOutlined className="stat-icon-simple" />
            <div className="stat-content-simple">
              <div className="stat-value-simple">{formatPrice(totalSpent)}</div>
              <div className="stat-label-simple">Tổng chi tiêu</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerInfoCard;

