import React from 'react';
import { Layout, Button, theme, Avatar, Dropdown } from 'antd';
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

  const userMenuItems = [
    {
      key: 'profile',
      label: 'Hồ sơ',
      icon: <UserOutlined />,
      onClick: handleProfileClick,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];

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
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ fontSize: '16px', width: 40, height: 40 }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Button
          type="text"
          icon={<BellOutlined />}
          style={{ fontSize: '16px', width: 40, height: 40 }}
        />
        {user && user.ten ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div
              style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}
              onClick={(e) => e.preventDefault()}
            >
              <Avatar style={{ backgroundColor: 'silver' }} icon={<UserOutlined />} />
              <span style={{ fontWeight: 'bold' }}>{user.ten}</span>
            </div>
          </Dropdown>
        ) : (
          <Avatar
            style={{ backgroundColor: 'silver', cursor: 'pointer' }}
            icon={<UserOutlined />}
            onClick={handleLoginClick}
          />
        )}
      </div>
    </Header>
  );
};

export default AppHeader;