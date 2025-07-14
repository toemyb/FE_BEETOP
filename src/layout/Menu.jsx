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
} from '@ant-design/icons';

const { Sider } = Layout;
const { SubMenu } = Menu;

const AppSider = ({ collapsed }) => {
  const location = useLocation();
  const pathname = location.pathname;

  // ✅ Tính selected key theo URL
  const getSelectedKey = () => {
    if (pathname.startsWith('/admin/san-pham')) return 'sanpham-sp';
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
    if (pathname.startsWith('/admin/dot-giam-gia')) return 'giamgia-dot';

    if (pathname.startsWith('/admin/ban-hang-tai-quay')) return 'banhang';
    if (pathname.startsWith('/admin/don-hang')) return 'donhang';
    if (pathname.startsWith('/admin/tra-hang')) return 'trahang';
    if (pathname.startsWith('/admin/thong-ke')) return 'thongke';

    return '';
  };

  // ✅ Tính open submenu dựa theo selected key
  const selectedKey = getSelectedKey();
  const getOpenKey = () => {
    if (selectedKey?.startsWith('sanpham')) return 'sanpham';
    if (selectedKey?.startsWith('taikhoan')) return 'taikhoan';
    if (selectedKey?.startsWith('giamgia')) return 'giamgia';
    return '';
  };

  const [openKeys, setOpenKeys] = useState([getOpenKey()]);

  // ✅ Mở submenu khi đường dẫn thay đổi
  useEffect(() => {
    setOpenKeys(collapsed ? [] : [getOpenKey()]);
  }, [pathname, collapsed]);

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
        selectedKeys={[selectedKey]} // ✅ Highlight đúng menu
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
            <Link to="/admin/lap-top">Sản Phẩm</Link>
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
