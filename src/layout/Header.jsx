import React from 'react';
import { Layout, Button, theme, Avatar, Dropdown } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, user, onLogout }) => {
  const {
    token: { colorBgContainer, colorPrimary, colorTextBase },
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', // Thêm bóng đổ nhẹ
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
          style={{ fontSize: '16px', width: 40, height: 40, color: colorTextBase }}
        />
        {user && user.ten ? (
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                gap: '12px',
                padding: '4px 8px',
                background: '#fff', // Nền trắng cho phần thông tin
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', // Bóng nhẹ
                transition: 'all 0.3s',
              }}
              onClick={(e) => e.preventDefault()}
              onMouseEnter={(e) => (e.currentTarget.style.background = colorBgContainer)}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
            >
              <Avatar
                src={user.anh || 'https://via.placeholder.com/40'}
                style={{
                  backgroundColor: user.anh ? 'transparent' : colorPrimary,
                  border: user.anh ? '1px solid #ddd' : 'none',
                }}
                icon={!user.anh && <UserOutlined />}
                size={40}
              />
              <div style={{ lineHeight: '1.2' }}>
                <span style={{ fontWeight: 'bold', color: colorTextBase }}>{user.ten}</span>
                <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>
                  {user.role || 'Không có vai trò'}
                </div>
              </div>
            </div>
          </Dropdown>
        ) : (
          <Avatar
            style={{
              backgroundColor: colorPrimary,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            }}
            icon={<UserOutlined />}
            onClick={handleLoginClick}
            size={40}
          />
        )}
      </div>
    </Header>
  );
};

export default AppHeader;