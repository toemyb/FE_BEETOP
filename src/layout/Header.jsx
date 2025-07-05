import React from 'react';
import { Layout, Button, theme, Avatar, Dropdown, Menu } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, user, onLogout }) => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/profile');
  };

  // Define the menu for the user dropdown
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" onClick={handleProfileClick}>
        <UserOutlined /> Hồ sơ
      </Menu.Item>
      <Menu.Item key="logout" onClick={onLogout}>
        <LogoutOutlined /> Đăng xuất
      </Menu.Item>
    </Menu>
  );

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
      {/* Menu toggle button */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ fontSize: '16px', width: 40, height: 40 }}
      />

      {/* User info / login area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Notification button */}
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: '16px', width: 40, height: 40 }}
        />

        {/* Avatar or User Name / Login button */}
        {user && user.ten ? ( // If user is logged in
          <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
              onClick={(e) => e.preventDefault()} // Prevent default click on div to let Dropdown handle it
            >
              <Avatar style={{ backgroundColor: 'silver' }} icon={<UserOutlined />} />
              <span style={{ fontWeight: 'bold' }}>{user.ten}</span>
            </div>
          </Dropdown>
        ) : ( // If no user is logged in
          <Avatar
            style={{ backgroundColor: 'silver', cursor: 'pointer' }}
            icon={<UserOutlined />}
            onClick={handleLoginClick} // Click to go to login page
          />
        )}
      </div>
    </Header>
  );
};

export default AppHeader;