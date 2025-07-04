import React from 'react';
import { Layout, Button, theme, Avatar } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, UserOutlined } from '@ant-design/icons';

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, user }) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Header
      style={{
        padding: '0 16px',
        background: colorBgContainer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* Nút toggle menu */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ fontSize: '16px', width: 40, height: 40 }}
      />

      {/* Thông tin người dùng */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BellOutlined style={{ fontSize: 20 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
            <div style={{ fontWeight: 500 }}>
              {user?.hoTen || 'Chưa đăng nhập'}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              {user?.vaiTro || 'ADmin'}
            </div>
          </div>
          <Avatar
            size="large"
            src={user?.anhDaiDien}
            icon={!user?.anhDaiDien && <UserOutlined />}
          />
        </div>
      </div>
    </Header>
  );
};

export default AppHeader;
