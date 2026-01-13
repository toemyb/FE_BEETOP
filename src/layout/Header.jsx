import React, { useEffect, useMemo, useRef, useState } from "react";
import { Layout, Button, theme, Avatar, Dropdown, Popover, ColorPicker, Tooltip, Badge, List, notification } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, BellOutlined, UserOutlined, LogoutOutlined, BgColorsOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { searchOrders } from "../service/OrderManagementService";
import { useAppTheme } from "../layout/AppThemeProvider";
const { Header } = Layout;

const AppHeader = ({ collapsed, setCollapsed, user, onLogout }) => {
  const {
    token: { colorBgContainer, colorPrimary, colorTextBase },
  } = theme.useToken();

  const navigate = useNavigate();
  const { isDark, toggleDark, primaryColor, setPrimaryColor } = useAppTheme();

  const [bellOpen, setBellOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loadingBell, setLoadingBell] = useState(false);

  const didInitRef = useRef(false);
  const seenIdsRef = useRef(new Set());

  const canUseBell = useMemo(() => {
    const r = String(user?.role || "").toUpperCase();
    return r === "ADMIN" || r === "NHAN_VIEN";
  }, [user?.role]);

  const fetchPendingConfirm = async () => {
    if (!canUseBell) return;

    try {
      setLoadingBell(true);

      const page = await searchOrders({
        loaiDon: "ONLINE",
        trangThaiDon: 1, // PENDING_CONFIRM
        page: 0,
        size: 6,
        sort: "ngayTao,desc",
      });

      const list = page?.content || [];
      const total = Number(page?.totalElements ?? list.length);

      setPendingOrders(list);
      setPendingCount(total);

      // ✅ notify khi có đơn mới (sau lần đầu)
      if (didInitRef.current) {
        const newOnes = list.filter((o) => o?.id && !seenIdsRef.current.has(o.id));
        if (newOnes.length > 0) {
          const o = newOnes[0];
          notification.info({
            message: "Có đơn ONLINE chờ xác nhận",
            description: `${o?.maDonHang || "Đơn mới"} • ${o?.tenKhachHang || "Khách"} • Tạo lúc: ${o?.ngayTao ? dayjs(o.ngayTao).format("HH:mm:ss DD/MM/YYYY") : ""}`,
            placement: "bottomRight",
            duration: 2,
          });
        }
      }

      seenIdsRef.current = new Set(list.map((o) => o?.id).filter(Boolean));
      didInitRef.current = true;
    } catch (e) {
      console.error("fetchPendingConfirm error:", e);
    } finally {
      setLoadingBell(false);
    }
  };

  useEffect(() => {
    if (!canUseBell) return;

    fetchPendingConfirm();
    const t = setInterval(fetchPendingConfirm, 30000); // 30s
    return () => clearInterval(t);
  }, [canUseBell]);

  useEffect(() => {
  if (!canUseBell) return;

  const handler = () => fetchPendingConfirm(); // refresh badge + list ngay
  window.addEventListener("orders:changed", handler);

  return () => window.removeEventListener("orders:changed", handler);
}, [canUseBell]);

  const preset = ["#1677ff", "#722ed1", "#52c41a", "#fa8c16", "#ff4d4f", "#13c2c2"];

  const colorContent = (
    <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 12 }}>
      <ColorPicker
        value={primaryColor}
        showText
        onChangeComplete={(c) => setPrimaryColor(c.toHexString())}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {preset.map((c) => (
          <div
            key={c}
            onClick={() => setPrimaryColor(c)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: c,
              cursor: "pointer",
              border:
                c.toLowerCase() === primaryColor.toLowerCase()
                  ? "2px solid #00000033"
                  : "1px solid #00000022",
            }}
            title={c}
          />
        ))}
      </div>
    </div>
  );

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/admin/profile');
  };

  const roleLabel = (role) => {
    const r = String(role || "").toUpperCase();
    if (r === "NHAN_VIEN") return "Nhân viên";
    if (r === "ADMIN") return "ADMIN";
    if (r === "KHACH_HANG") return "Khách hàng";
    return role || "Không có vai trò";
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
  const bellContent = (
    <div style={{ width: 360 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <b>Đơn chờ xác nhận</b>
        <Button size="small" onClick={fetchPendingConfirm} loading={loadingBell}>
          Làm mới
        </Button>
      </div>

      <List
        size="small"
        loading={loadingBell}
        dataSource={pendingOrders}
        locale={{ emptyText: "Không có đơn chờ xác nhận" }}
        renderItem={(o) => (
          <List.Item
            style={{ cursor: "pointer" }}
            onClick={() => {
              setBellOpen(false);
              navigate(`/admin/orders/${o.id}`);
            }}
          >
            <List.Item.Meta
              title={<span style={{ fontWeight: 700 }}>{o?.maDonHang || "—"}</span>}
              description={
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span>{o?.tenKhachHang || "Khách"}</span>
                  <span style={{ opacity: 0.7 }}>
                    {o?.ngayTao ? dayjs(o.ngayTao).format("HH:mm:ss DD/MM/YYYY") : ""}
                  </span>
                </div>
              }
            />
          </List.Item>
        )}
      />

      <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.75 }}>Tổng: <b>{pendingCount}</b> đơn</span>
        <Button
          type="link"
          style={{ padding: 0 }}
          onClick={() => {
            setBellOpen(false);
            navigate("/admin/don-hang");
          }}
        >
          Xem tất cả
        </Button>
      </div>
    </div>
  );
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



        {/* ✅ Nút đổi màu (Popover + ColorPicker) */}
        <Popover
          content={colorContent}
          title="Đổi màu giao diện"
          trigger="click"
          placement="bottomRight"
        >
          <Button
            type="text"
            icon={<BgColorsOutlined />}
            style={{ fontSize: "16px", width: 40, height: 40, color: colorTextBase }}
          />
        </Popover>

        {/* Nút chuông cũ của bạn */}
        <Popover
          content={bellContent}
          trigger="click"
          placement="bottomRight"
          open={bellOpen}
          onOpenChange={setBellOpen}
        >
          <Badge count={canUseBell ? pendingCount : 0} overflowCount={99} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{ fontSize: "16px", width: 40, height: 40, color: colorTextBase }}
              disabled={!canUseBell}
            />
          </Badge>
        </Popover>

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
                src={user.anh || '/default-avatar.png'}
                style={{
                  backgroundColor: user.anh ? 'transparent' : colorPrimary,
                  border: user.anh ? '1px solid #ddd' : 'none',
                }}
                icon={!user.anh && <UserOutlined />}
                size={40}
              />
              <div style={{ lineHeight: "1.2" }}>
                <span style={{ fontWeight: "bold", color: colorTextBase }}>{user.ten}</span>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                  {roleLabel(user.role)}
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