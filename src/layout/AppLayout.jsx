// layout/AppLayout.jsx
import React, { useState } from 'react';
import { Layout } from 'antd';
import AppSider from './Menu'; // Assuming this is your sidebar component
import AppHeader from './Header'; // Your updated AppHeader component

const { Content } = Layout;

// Accept user and onLogout props
const AppLayout = ({ children, user, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Fixed Sidebar */}
      <Layout.Sider
        width={250}
        collapsible
        collapsed={collapsed}
        trigger={null}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
        }}
      >
        <AppSider collapsed={collapsed} />
      </Layout.Sider>

      {/* Main content area */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250 }}>
        {/* Pass user and onLogout to AppHeader */}
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} user={user} onLogout={onLogout} />

        <Content
          style={{
            margin: 16,
            padding: 16,
            background: '#fff',
            height: 'calc(100vh - 64px)', // 64px is default Header height
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;