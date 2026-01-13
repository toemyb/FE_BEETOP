import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import "./Auth.css";
import beeTopLogo from "../../img/BeeTop2.png";
const Login = ({ setToken, setUser }) => {
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const setAuthStorage = (data, meta, values) => {
    const { accessToken, refreshToken } = meta.tokenInfo;

    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    setToken?.(accessToken);

    sessionStorage.setItem("idTaiKhoan", data.id);
    localStorage.setItem("customerId", data.id);
    localStorage.removeItem("isUser");

    const roleRaw = (data.tenChucVu || "").toUpperCase();

    const loggedInUser = {
      id: data.id,
      ten: data.ten || data.tenDangNhap || values?.username || "",
      tenDangNhap: data.tenDangNhap,
      email: data.email,
      soDienThoai: data.soDienThoai,
      gioiTinh: data.gioiTinh,
      ngaySinh: data.ngaySinh,
      role: roleRaw || "USER",
      anh: data.anh || null,
    };

    sessionStorage.setItem("user", JSON.stringify(loggedInUser));
    setUser?.(loggedInUser);

    const isKhachHang =
      roleRaw.includes("KHACH") || roleRaw.includes("CUSTOMER") || roleRaw === "USER";

    if (isKhachHang) {
      localStorage.setItem("isCustomer", "true");
      navigate("/");
    } else {
      localStorage.removeItem("isCustomer");
      navigate("/admin/thong-ke");
    }
  };

  const handleSubmit = async (values) => {
    try {
      const res = await api.post("/auth/signin", {
        tenDangNhap: values.username,
        matKhau: values.password,
      });

      const { data, meta } = res.data;
      setAuthStorage(data, meta, values);
      message.success("Đăng nhập thành công!");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Tên đăng nhập hoặc mật khẩu không đúng.";
      setErr(errorMessage);
      message.error(errorMessage);
    }
  };

  return (
    <div className="authPageLite">
      <div className="authCardWhite">
        <div className="authHeader">
          {/* Đổi đúng path logo của bạn */}
          <img className="authLogo" src={beeTopLogo} alt="BeeTop" />
          <h2 className="authTitle">Đăng nhập</h2>
          <p className="authSub">Chào mừng bạn quay lại BeeTop</p>
        </div>

        <Form layout="vertical" onFinish={handleSubmit} autoComplete="on">
          <Form.Item
            label="Email / Số điện thoại"
            name="username"
            rules={[{ required: true, message: "Vui lòng nhập Email hoặc SĐT!" }]}
          >
            <Input
              size="large"
              className="authInput"
              prefix={<UserOutlined />}
              placeholder="email@gmail.com / 09xx..."
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
          >
            <Input.Password
              size="large"
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>

          {err && <div className="authError">{err}</div>}

          <div className="authRow">
            <Checkbox>Ghi nhớ</Checkbox>
            <button
              type="button"
              className="authLink"
              onClick={() => navigate("/forgot-password")}
            >
              Quên mật khẩu?
            </button>
          </div>

          <Button type="primary" htmlType="submit" size="large" className="authBtn">
            Đăng nhập
          </Button>

          <div className="authBottom">
            Chưa có tài khoản?{" "}
            <button type="button" className="authLink" onClick={() => navigate("/register")}>
              Đăng ký
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;
