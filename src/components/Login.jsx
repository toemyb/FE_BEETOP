import React, { useState } from "react";
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Form } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import api from '../service/api';

const Login = ({ setToken, setUser }) => {
  const [err, setErr] = useState("");
  const navigate = useNavigate();

 const handleSubmit = async (values) => {
  try {
    const res = await api.post("/auth/signin", {
      tenDangNhap: values.username,
      matKhau: values.password,
    });

    const { data, meta } = res.data;
    const { accessToken, refreshToken } = meta.tokenInfo;

    // Sử dụng sessionStorage thay vì localStorage
    sessionStorage.setItem('accessToken', accessToken);
    sessionStorage.setItem('refreshToken', refreshToken);
    setToken(accessToken);

      const loggedInUser = {
        ten: data.ten || data.tenDangNhap || values.username,
        tenDangNhap: data.tenDangNhap,
        email: data.email,
        soDienThoai: data.soDienThoai,
        gioiTinh: data.gioiTinh,
        ngaySinh: data.ngaySinh,
        role: data.tenChucVu ? data.tenChucVu.toUpperCase() : 'USER',
        anh: data.anh || null // Thêm trường anh
      };
      
       sessionStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);

      message.success('Đăng nhập thành công!');
      // Redirect based on role
      if (loggedInUser.role === 'KHACH_HANG') {
        navigate('/customer/home');
      } else {
        navigate('/admin/thong-ke');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Tên đăng nhập hoặc mật khẩu không đúng.';
      setErr(errorMessage);
      message.error(errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Đăng nhập</h3>
      <Form
        name="login"
        initialValues={{ remember: true }}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: 'Vui lòng nhập Số điện thoại hoặc Email!' }]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="Số điện thoại hoặc Email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mật khẩu"
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
        onClick={() => (window.location.href = "http://localhost:8080/oauth2/authorization/google")}
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
          <a style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate('/')}>
            Quay lại Trang chủ
          </a>
        </p>
        <p>
          <a style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate('/forgot-password')}>
            Quên mật khẩu?
          </a>
        </p>
        <p>
          Chưa có tài khoản?{" "}
          <a style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => navigate('/register')}>
            Đăng ký ngay
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;