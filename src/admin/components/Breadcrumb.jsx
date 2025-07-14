import React from 'react';
import { Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

/**
 * @param {Array} items - Mảng các phần tử breadcrumb dạng { label, link? }
 */
const AdminBreadcrumb = ({ items = [] }) => {
  return (
    <Breadcrumb style={{ marginBottom: 16 }}>
      <Breadcrumb.Item>
        <Link to="/admin">
          <HomeOutlined /> Trang chủ
        </Link>
      </Breadcrumb.Item>

      {items.map((item, idx) => (
        <Breadcrumb.Item key={idx}>
          {item.link ? <Link to={item.link}>{item.label}</Link> : item.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  );
};

export default AdminBreadcrumb;
