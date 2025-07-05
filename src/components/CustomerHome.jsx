import React from 'react';
import { Card, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const CustomerHome = ({ user }) => {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20 }}>
      <Card
        title={<Title level={3}>Chào mừng, {user?.ten || 'Khách hàng'}</Title>}
        style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}
      >
        <Text strong>Thông tin tài khoản:</Text>
        <br />
        <Text>Tên: {user?.ten || 'Chưa cập nhật'}</Text>
        <br />
        <Text>Email: {user?.email || 'Chưa cập nhật'}</Text>
        <br />
        <Text>Số điện thoại: {user?.soDienThoai || 'Chưa cập nhật'}</Text>
        <br />
        <Text>Ngày sinh: {user?.ngaySinh || 'Chưa cập nhật'}</Text>
        <br />
        <Text>Giới tính: {user?.gioiTinh || 'Chưa cập nhật'}</Text>
        <br />
        <br />
        <Button
          type="primary"
          onClick={() => navigate('/login')}
          style={{ marginTop: 16 }}
        >
          Quay lại Trang chủ
        </Button>
      </Card>
    </div>
  );
};

export default CustomerHome;