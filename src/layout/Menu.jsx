import React, { useState } from 'react';
import { Layout, Menu } from 'antd';
import { Link } from 'react-router-dom';
import {
  PieChartOutlined,
  ShoppingCartOutlined,
  DropboxOutlined,
  RollbackOutlined,
  AppstoreOutlined,
  TeamOutlined,
  StarOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const AppSider = ({ collapsed }) => {
  const [openKeys, setOpenKeys] = useState(['sanpham']);

  const handleOpenChange = (keys) => {
    const latest = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latest ? [latest] : []);
  };

  return (
    <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
      <div
        style={{
          padding: 16,
          fontWeight: 'bold',
          fontSize: 16,
          color: 'white',
          textAlign: 'center',
        }}
      >
        {!collapsed && 'BeeLapTop'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={handleOpenChange}
        defaultSelectedKeys={['thongke']}
      >
        <Menu.Item key="thongke" icon={<PieChartOutlined />}>

          <Link to="/admin/thong-ke">Thống Kê</Link>

        </Menu.Item>

        <Menu.Item key="banhang" icon={<ShoppingCartOutlined />}>

          <Link to="/admin/ban-hang-tai-quay">Bán Hàng Tại Quầy</Link>

        </Menu.Item>

        <Menu.Item key="donhang" icon={<DropboxOutlined />}>

          <Link to="/admin/don-hang">Đơn Hàng</Link>

        </Menu.Item>

        <Menu.Item key="trahang" icon={<RollbackOutlined />}>

          <Link to="/admin/tra-hang">Trả Hàng</Link>

        </Menu.Item>

        <SubMenu key="sanpham" icon={<AppstoreOutlined />} title="Quản Lý Sản Phẩm">

        <Menu.Item key="sanpham-sp">
            <Link to="/admin/san-pham">Sản Phẩm</Link>
          </Menu.Item>
   
          <Menu.Item key="sanpham-dohoa">
            <Link to="/admin/do-hoa">Đồ Họa</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-mausac">
            <Link to="/admin/mau-sac">Màu Sắc</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-cpu">
            <Link to="/admin/cpu">Cpu</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-seri">
            <Link to="/admin/seri">Seri</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-ram">
            <Link to="/admin/ram">Ram</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-rom">
            <Link to="/admin/rom">Rom</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-hang">
            <Link to="/admin/hang">Hãng</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-pin">
            <Link to="/admin/pin">Pin</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-danhmuc">
            <Link to="/admin/danh-muc">Danh Mục</Link>
          </Menu.Item>

          <Menu.Item key="sanpham-manhinh">
            <Link to="/admin/man-hinh">Màn Hình</Link>
          </Menu.Item>

        </SubMenu>

        <SubMenu key="taikhoan" icon={<TeamOutlined />} title="Tài Khoản">

          <Menu.Item key="taikhoan-nhanvien">
            <Link to="/admin/nhan-vien">Nhân Viên</Link>
          </Menu.Item>
          <Menu.Item key="taikhoan-khachhang">
            <Link to="/admin/khach-hang">Khách Hàng</Link>
          </Menu.Item>


        </SubMenu>

        <SubMenu key="giamgia" icon={<StarOutlined />} title="Giảm Giá">

          <Menu.Item key="giamgia-phieu">
            <Link to="/admin/phieu-giam-gia">Phiếu Giảm Giá</Link>
          </Menu.Item>
          <Menu.Item key="giamgia-dot">

            <Link to="/admin/dot-giam-gia">Đợt Giảm Giá</Link>

          </Menu.Item>

        </SubMenu>




      </Menu>
    </Sider>
  );
};

export default AppSider;