import React from 'react';
import { Layout, theme } from 'antd';

const { Content } = Layout;

const AppContent = ({ children }) => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  return (
    <Content
      style={{
        margin: '16px',
        padding: 24,
        minHeight: 280,
        background: colorBgContainer,
        borderRadius: borderRadiusLG,
        overflow: 'auto',
      }}
    >
      {children} {/* 🟢 Quan trọng: đây là nơi Route sẽ hiển thị */}
    </Content>
  );
};

export default AppContent;
