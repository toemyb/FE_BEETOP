import React, { useEffect, useMemo, useState } from "react";
import { Card, Avatar, Descriptions, Button, Tag, message, Space } from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import "./AdminProfile.css";

const roleColor = (role) => {
  const r = (role || "").toUpperCase();
  if (r.includes("ADMIN")) return "red";
  if (r.includes("NHAN") || r.includes("STAFF") || r.includes("EMP")) return "blue";
  return "default";
};

const formatDate = (d) => {
  if (!d) return "—";
  // backend có thể trả ISO string
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN");
};

const AdminProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [me, setMe] = useState(user || null);

  useEffect(() => {
    // fallback: lấy từ sessionStorage nếu props chưa truyền
    if (!user) {
      const raw = sessionStorage.getItem("user");
      if (raw) setMe(JSON.parse(raw));
    } else {
      setMe(user);
    }
  }, [user]);

  const display = useMemo(() => {
    if (!me) return null;
    return {
      ten: me.ten || me.tenDangNhap || "—",
      tenDangNhap: me.tenDangNhap || "—",
      email: me.email || "—",
      soDienThoai: me.soDienThoai || "—",
      gioiTinh: me.gioiTinh || "—",
      ngaySinh: formatDate(me.ngaySinh),
      role: (me.role || "—").toUpperCase(),
      id: me.id || "—",
      anh: me.anh || null,
    };
  }, [me]);

  if (!display) {
    return (
      <div className="profileWrap">
        <Card className="profileCard">
          <div className="profileEmpty">
            <UserOutlined style={{ fontSize: 28, opacity: 0.6 }} />
            <div>Chưa có thông tin người dùng. Vui lòng đăng nhập lại.</div>
            <Button type="primary" onClick={() => navigate("/login")}>
              Đi tới đăng nhập
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const handleEdit = () => {
    // nếu bạn có trang sửa hồ sơ admin, đổi route ở đây
    message.info("Bạn có thể tạo trang /profile/edit để sửa thông tin.");
  };

  const handleChangePassword = () => {
    // nếu bạn có route đổi mật khẩu riêng cho admin, đổi route ở đây
    navigate("/forgot-password");
  };

  const handleBack = () => {
    // về dashboard admin
    navigate("/admin/thong-ke");
  };

  const handleLogout = () => {
    if (onLogout) return onLogout();
    // fallback
    sessionStorage.clear();
    localStorage.removeItem("isCustomer");
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  return (
    <div className="profileWrap">
      <Card className="profileCard" bordered={false}>
        <div className="profileTop">
          <div className="profileIdentity">
            <Avatar
              size={72}
              src={display.anh || undefined}
              icon={!display.anh && <UserOutlined />}
              className="profileAvatar"
            />
            <div className="profileNameBlock">
              <div className="profileNameRow">
                <div className="profileName">{display.ten}</div>
                <Tag color={roleColor(display.role)} className="profileRole">
                  {display.role}
                </Tag>
              </div>
              <div className="profileSub">
                <span className="muted">
                  <IdcardOutlined /> {display.tenDangNhap}
                </span>
                <span className="dot">•</span>
                <span className="muted">
                  <MailOutlined /> {display.email}
                </span>
              </div>
            </div>
          </div>

          <Space className="profileActions">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Dashboard
            </Button>
            <Button icon={<EditOutlined />} onClick={handleEdit}>
              Sửa
            </Button>
            <Button icon={<LockOutlined />} onClick={handleChangePassword}>
              Đổi mật khẩu
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Space>
        </div>

        <Descriptions
          title="Thông tin tài khoản"
          column={{ xs: 1, sm: 1, md: 2 }}
          className="profileDesc"
        >
          <Descriptions.Item label="ID">{display.id}</Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color={roleColor(display.role)}>{display.role}</Tag>
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            <span className="descRow">
              <MailOutlined /> {display.email}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">
            <span className="descRow">
              <PhoneOutlined /> {display.soDienThoai}
            </span>
          </Descriptions.Item>

          <Descriptions.Item label="Giới tính">{display.gioiTinh}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{display.ngaySinh}</Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default AdminProfile;
