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
  UserOutlined,
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const AppSider = ({ collapsed, user }) => {
  const [openKeys, setOpenKeys] = useState(['sanpham']);

  const handleOpenChange = (keys) => {
    const latest = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latest ? [latest] : []);
  };

  const menuItems = user?.role === 'KHACH_HANG' ? [
    {
      key: 'customer',
      icon: <UserOutlined />,
      label: <Link to="/customer/home">Trang Khách Hàng</Link>,
    },
  ] : [
    {
      key: 'thongke',
      icon: <PieChartOutlined />,
      label: <Link to="/admin/thong-ke">Thống Kê</Link>,
      disabled: !['ADMIN', 'NHAN_VIEN'].includes(user?.role),
    },
    {
      key: 'banhang',
      icon: <ShoppingCartOutlined />,
      label: <Link to="/admin/ban-hang-tai-quay">Bán Hàng Tại Quầy</Link>,
      disabled: !['ADMIN', 'NHAN_VIEN'].includes(user?.role),
    },
    {
      key: 'donhang',
      icon: <DropboxOutlined />,
      label: <Link to="/admin/don-hang">Đơn Hàng</Link>,
      disabled: !['ADMIN', 'NHAN_VIEN'].includes(user?.role),
    },
    {
      key: 'trahang',
      icon: <RollbackOutlined />,
      label: <Link to="/admin/tra-hang">Trả Hàng</Link>,
      disabled: !['ADMIN', 'NHAN_VIEN'].includes(user?.role),
    },
    {
      key: 'sanpham',
      icon: <AppstoreOutlined />,
      label: 'Quản Lý Sản Phẩm',
      disabled: user?.role !== 'ADMIN',
      children: [
        { key: 'sanpham-sp', label: <Link to="/admin/san-pham">Sản Phẩm</Link> },
        { key: 'sanpham-dohoa', label: <Link to="/admin/do-hoa">Đồ Họa</Link> },
        { key: 'sanpham-mausac', label: <Link to="/admin/mau-sac">Màu Sắc</Link> },
        { key: 'sanpham-cpu', label: <Link to="/admin/cpu">Cpu</Link> },
        { key: 'sanpham-seri', label: <Link to="/admin/seri">Seri</Link> },
        { key: 'sanpham-ram', label: <Link to="/admin/ram">Ram</Link> },
        { key: 'sanpham-rom', label: <Link to="/admin/rom">Rom</Link> },
        { key: 'sanpham-hang', label: <Link to="/admin/hang">Hãng</Link> },
        { key: 'sanpham-pin', label: <Link to="/admin/pin">Pin</Link> },
        { key: 'sanpham-danhmuc', label: <Link to="/admin/danh-muc">Danh Mục</Link> },
        { key: 'sanpham-manhinh', label: <Link to="/admin/man-hinh">Màn Hình</Link> },
      ],
    },
    {
      key: 'taikhoan',
      icon: <TeamOutlined />,
      label: 'Tài Khoản',
      disabled: user?.role !== 'ADMIN',
      children: [
        { key: 'taikhoan-nhanvien', label: <Link to="/admin/nhan-vien">Nhân Viên</Link> },
        { key: 'taikhoan-khachhang', label: <Link to="/admin/khach-hang">Khách Hàng</Link> },
      ],
    },
    {
      key: 'giamgia',
      icon: <StarOutlined />,
      label: 'Giảm Giá',
      disabled: user?.role !== 'ADMIN',
      children: [
        { key: 'giamgia-phieu', label: <Link to="/admin/phieu-giam-gia">Phiếu Giảm Giá</Link> },
        { key: 'giamgia-dot', label: <Link to="/dot-giam-gia">Đợt Giảm Giá</Link> },
      ],
    },
  ];

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

            <Link to="/dot-giam-gia">Đợt Giảm Giá</Link>

          </Menu.Item>

        </SubMenu>




      </Menu>
    </Sider>
  );
};

export default AppSider;