import React, { useState } from 'react';
import { Layout } from 'antd';
import AppSider from './Menu';
import AppHeader from './Header';

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar cố định */}
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
        
        }}
      >
        <AppSider collapsed={collapsed} />
      </Layout.Sider>

      {/* Phần nội dung */}
      <Layout style={{ marginLeft: collapsed ? 80 : 250 }}>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} />

        <Content
          style={{
            margin: 16,
            padding: 16,
            background: '#fff',
            height: 'calc(100vh - 64px)',
            overflowY: 'auto', // ✅ Đảm bảo không bị che notification
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
