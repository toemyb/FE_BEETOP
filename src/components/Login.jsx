// src/components/Login.js
import React, { useState } from "react";
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const Login = ({ setToken, setUser }) => {
  const [tenDangNhap, setTenDangNhap] = useState("");
  const [matKhau, setMatKhau] = useState("");
  const [err, setErr] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async () => { // Changed to async function for onFinish
    setErr("");

    try {
      const res = await fetch("/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Ensure cookies/credentials are sent if needed
        body: JSON.stringify({ tenDangNhap, matKhau }),
      });
      const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : {};

      if (res.ok && data.meta?.tokenInfo?.accessToken) {
        // Store access token
        localStorage.setItem('accessToken', data.meta.tokenInfo.accessToken); // Corrected: Store accessToken
        setToken(data.meta.tokenInfo.accessToken); // Update state

        if (data.data) {
          const loggedInUser = {
            ten: data.data.ten || data.data.tenDangNhap,
            tenDangNhap: data.data.tenDangNhap,
            email: data.data.email,
            soDienThoai: data.data.soDienThoai,
            gioiTinh: data.data.gioiTinh,
            ngaySinh: data.data.ngaySinh,
            // Convert role from backend (e.g., "admin", "staff") to uppercase ("ADMIN", "STAFF")
            role: data.data.tenChucVu ? data.data.tenChucVu.toUpperCase() : 'USER',
          };
          localStorage.setItem('user', JSON.stringify(loggedInUser));
          setUser(loggedInUser);
        } else {
          message.warning('Đăng nhập thành công nhưng không lấy được thông tin người dùng chi tiết.');
          // Provide a default user with a 'USER' role if detailed data is missing
          const defaultUser = { ten: tenDangNhap, tenDangNhap: tenDangNhap, role: 'USER' };
          setUser(defaultUser);
          localStorage.setItem('user', JSON.stringify(defaultUser));
        }

        message.success('Đăng nhập thành công!');
        navigate('/admin/thong-ke'); // Redirect to admin dashboard after successful login
      } else {
        setErr(data.message || "Tên đăng nhập hoặc mật khẩu không đúng.");
        message.error(data.message || "Đăng nhập thất bại!");
      }
    } catch (networkError) {
      setErr("Lỗi mạng: Không thể kết nối đến máy chủ.");
      message.error("Lỗi mạng: Không thể kết nối đến máy chủ!");
      console.error("Network error:", networkError);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Đăng nhập</h3>
      <Form
        name="login"
        initialValues={{ remember: true }}
        layout="vertical"
        onFinish={handleSubmit} // Use onFinish for Ant Design Form
      >
        <Form.Item
          name="username" // Name for Ant Design Form.Item
          rules={[{ required: true, message: 'Vui lòng nhập Tên đăng nhập hoặc Email!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Tên đăng nhập hoặc Email"
            value={tenDangNhap}
            onChange={(e) => setTenDangNhap(e.target.value)}
          />
        </Form.Item>

        <Form.Item
          name="password" // Name for Ant Design Form.Item
          rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mật khẩu"
            value={matKhau}
            onChange={(e) => setMatKhau(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Đăng nhập
          </Button>
        </Form.Item>
      </Form>

      <Button
        type="default"
        onClick={() =>
          (window.location.href = "http://localhost:8080/oauth2/authorization/google")
        }
        style={{
          width: '100%',
          backgroundColor: "#db4437",
          color: "#fff",
          borderColor: "#db4437",
          marginTop: 10,
        }}
      >
        Đăng nhập bằng Google
      </Button>

      {err && <div style={{ color: "red", marginTop: 10, textAlign: 'center' }}>{err}</div>}

      <div style={{ marginTop: 15, textAlign: 'center' }}>
        <p>
          <a
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => navigate('/')}
          >
            Quay lại Trang chủ
          </a>
        </p>

        <p>
          <a
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => navigate('/forgot-password')}
          >
            Quên mật khẩu?
          </a>
        </p>
        <p>
          Chưa có tài khoản?{" "}
          <a
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() => navigate('/register')}
          >
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;