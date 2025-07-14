import React, { useState, useEffect } from 'react';
import { Layout, Menu } from 'antd';
import { Link, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const pathname = location.pathname;

  const getSelectedKey = () => {
    if (pathname.startsWith('/admin/san-pham') || pathname.startsWith('/admin/lap-top')) return 'sanpham-sp';
    if (pathname.startsWith('/admin/do-hoa')) return 'sanpham-dohoa';
    if (pathname.startsWith('/admin/mau-sac')) return 'sanpham-mausac';
    if (pathname.startsWith('/admin/cpu')) return 'sanpham-cpu';
    if (pathname.startsWith('/admin/seri')) return 'sanpham-seri';
    if (pathname.startsWith('/admin/ram')) return 'sanpham-ram';
    if (pathname.startsWith('/admin/rom')) return 'sanpham-rom';
    if (pathname.startsWith('/admin/hang')) return 'sanpham-hang';
    if (pathname.startsWith('/admin/pin')) return 'sanpham-pin';
    if (pathname.startsWith('/admin/danh-muc')) return 'sanpham-danhmuc';
    if (pathname.startsWith('/admin/man-hinh')) return 'sanpham-manhinh';

    if (pathname.startsWith('/admin/nhan-vien')) return 'taikhoan-nhanvien';
    if (pathname.startsWith('/admin/khach-hang')) return 'taikhoan-khachhang';

    if (pathname.startsWith('/admin/phieu-giam-gia')) return 'giamgia-phieu';
    if (pathname.startsWith('/dot-giam-gia')) return 'giamgia-dot';

    if (pathname.startsWith('/admin/ban-hang-tai-quay')) return 'banhang';
    if (pathname.startsWith('/admin/don-hang')) return 'donhang';
    if (pathname.startsWith('/admin/tra-hang')) return 'trahang';
    if (pathname.startsWith('/admin/thong-ke')) return 'thongke';

    return '';
  };

  const selectedKey = getSelectedKey();
  const getOpenKey = () => {
    if (selectedKey?.startsWith('sanpham')) return 'sanpham';
    if (selectedKey?.startsWith('taikhoan')) return 'taikhoan';
    if (selectedKey?.startsWith('giamgia')) return 'giamgia';
    return '';
  };

  const [openKeys, setOpenKeys] = useState([getOpenKey()]);

  useEffect(() => {
    setOpenKeys(collapsed ? [] : [getOpenKey()]);
  }, [pathname, collapsed]);

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
        { key: 'sanpham-sp', label: <Link to="/admin/lap-top">Sản Phẩm</Link> },
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
        selectedKeys={[selectedKey]}
      >
        {menuItems.map((item) =>
          item.children ? (
            <SubMenu key={item.key} icon={item.icon} title={item.label} disabled={item.disabled}>
              {item.children.map((child) => (
                <Menu.Item key={child.key}>{child.label}</Menu.Item>
              ))}
            </SubMenu>
          ) : (
            <Menu.Item key={item.key} icon={item.icon} disabled={item.disabled}>
              {item.label}
            </Menu.Item>
          )
        )}
      </Menu>
    </Sider>
  );
};

export default AppSider;
