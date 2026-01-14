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
import beeTopLogo from "../img/BeeTop.png";
const { Sider } = Layout;


const AppSider = ({ collapsed, user }) => {
  const location = useLocation();
  const pathname = location.pathname;

  const getSelectedKey = () => {
    if (pathname.startsWith('/admin/san-pham') || pathname.startsWith('/admin/lap-top')) return 'sanpham-sp';
    if (pathname.startsWith('/admin/do-hoa')) return 'sanpham-dohoa';
    if (pathname.startsWith('/admin/add-lap-top')) return 'sanpham-sp';
    if (pathname.startsWith('/admin/sua-lap-top')) return 'sanpham-sp';
    if (pathname.startsWith('/admin/lap-top-ct')) return 'sanpham-sp';
    if (pathname.startsWith('/admin/mau-sac')) return 'sanpham-mausac';
    if (pathname.startsWith('/admin/cpu')) return 'sanpham-cpu';
    // if (pathname.startsWith('/admin/seri')) return 'sanpham-seri';
    if (pathname.startsWith('/admin/ram')) return 'sanpham-ram';
    if (pathname.startsWith('/admin/rom')) return 'sanpham-rom';
    if (pathname.startsWith('/admin/he-dieu-hanh')) return 'sanpham-hedieuhanh';
    if (pathname.startsWith('/admin/pin')) return 'sanpham-pin';
    if (pathname.startsWith('/admin/kich-thuoc')) return 'sanpham-kichthuoc';
    if (pathname.startsWith('/admin/thuong-hieu')) return 'sanpham-thuonghieu';
    if (pathname.startsWith('/admin/man-hinh')) return 'sanpham-manhinh';


    if (pathname.startsWith('/admin/nhan-vien')) return 'taikhoan-nhanvien';
    if (pathname.startsWith('/admin/khach-hang')) return 'taikhoan-khachhang';

    if (pathname.startsWith('/admin/phieu-giam-gia')) return 'giamgia-phieu';
    if (pathname.startsWith('/dot-giam-gia')) return 'giamgia-dot';

    if (pathname.startsWith('/admin/ban-hang-tai-quay')) return 'banhang';
    if (pathname.startsWith('/admin/don-hang')) return 'donhang';
  
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

  const [openKeys, setOpenKeys] = useState(() => {
    const k = getOpenKey();
    return k ? [k] : [];
  });

  useEffect(() => {
    const k = getOpenKey();
    setOpenKeys(collapsed ? [] : (k ? [k] : []));
  }, [pathname, collapsed]);

  const handleOpenChange = (keys) => {
    const latest = keys.find((key) => !openKeys.includes(key));
    setOpenKeys(latest ? [latest] : []);
  };

  const role = (user?.role || "").trim().replace(/^ROLE_/, "");

  const isCustomer = role === "KHACH_HANG";
  const isAdmin = role === "ADMIN";
  const isStaff = role === "NHAN_VIEN";

  const menuItems = isCustomer
    ? [
      {
        key: "customer",
        icon: <UserOutlined />,
        label: <Link to="/customer/home">Trang Khách Hàng</Link>,
      },
    ]
    : [
      // ✅ NHAN_VIEN và ADMIN đều thấy
      {
        key: "thongke",
        icon: <PieChartOutlined />,
        label: <Link to="/admin/thong-ke">Thống Kê</Link>,
      },
      {
        key: "banhang",
        icon: <ShoppingCartOutlined />,
        label: <Link to="/admin/ban-hang-tai-quay">Bán Hàng Tại Quầy</Link>,
      },
      {
        key: "donhang",
        icon: <DropboxOutlined />,
        label: <Link to="/admin/don-hang">Đơn Hàng</Link>,
      },
     

      // ✅ Quản lý sản phẩm: NHAN_VIEN + ADMIN đều thấy
      {
        key: "sanpham",
        icon: <AppstoreOutlined />,
        label: "Quản Lý Sản Phẩm",
        children: [
          { key: "sanpham-sp", label: <Link to="/admin/lap-top">Sản Phẩm</Link> },
          { key: "sanpham-dohoa", label: <Link to="/admin/do-hoa">Đồ Họa</Link> },
          { key: "sanpham-mausac", label: <Link to="/admin/mau-sac">Màu Sắc</Link> },
          { key: "sanpham-cpu", label: <Link to="/admin/cpu">Cpu</Link> },
          { key: "sanpham-ram", label: <Link to="/admin/ram">Ram</Link> },
          { key: "sanpham-rom", label: <Link to="/admin/rom">Rom</Link> },
          { key: "sanpham-pin", label: <Link to="/admin/pin">Pin</Link> },
          { key: "sanpham-hedieuhanh", label: <Link to="/admin/he-dieu-hanh">Hệ Điều Hành</Link> },
          { key: "sanpham-kichthuoc", label: <Link to="/admin/kich-thuoc">Kích Thước</Link> },
          { key: "sanpham-thuonghieu", label: <Link to="/admin/thuong-hieu">Thương Hiệu</Link> },
          { key: "sanpham-manhinh", label: <Link to="/admin/man-hinh">Màn Hình</Link> },
        ],
      },

      // ✅ Tài khoản: NHAN_VIEN chỉ thấy Khách Hàng, ADMIN thấy cả Nhân Viên
      {
        key: "taikhoan",
        icon: <TeamOutlined />,
        label: "Tài Khoản",
        children: [
          // ADMIN mới thấy menu Nhân Viên
          isAdmin && { key: "taikhoan-nhanvien", label: <Link to="/admin/nhan-vien">Nhân Viên</Link> },

          // NHAN_VIEN + ADMIN đều thấy Khách Hàng
          { key: "taikhoan-khachhang", label: <Link to="/admin/khach-hang">Khách Hàng</Link> },
        ].filter(Boolean),
      },

      // ✅ Giảm giá: NHAN_VIEN + ADMIN đều có quyền xem list theo BE của bạn
      {
        key: "giamgia",
        icon: <StarOutlined />,
        label: "Giảm Giá",
        children: [
          { key: "giamgia-phieu", label: <Link to="/admin/phieu-giam-gia">Phiếu Giảm Giá</Link> },
        ],
      },
    ].filter(Boolean);

  const items = menuItems.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    disabled: !!item.disabled,
    children: item.children
      ? item.children.map((child) => ({
        key: child.key,
        label: child.label,
        disabled: !!child.disabled,
      }))
      : undefined,
  }));
  return (
    <Sider trigger={null} collapsible collapsed={collapsed} style={{ background: '#001529' }}>
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
        }}
      >
        <img
          src={beeTopLogo}
          alt="BeeTop"
          style={{
            height: collapsed ? 32 : 44, // thu nhỏ khi collapsed
            width: "auto",
            objectFit: "contain",
            display: "block",
            transition: "all 0.2s ease",
          }}
        />
      </div>

      <Menu
        theme="dark"
        mode="inline"
        openKeys={collapsed ? [] : openKeys}
        onOpenChange={handleOpenChange}
        selectedKeys={[selectedKey]}
        items={items}
      />
    </Sider>
  );
};

export default AppSider;
