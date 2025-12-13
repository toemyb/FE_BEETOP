import React, { useState } from "react";
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Form } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const onFinish = async () => {
    try {
      const res = await fetch("/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // Backend của bạn có thể trả về một đối tượng JSON kể cả khi thành công
      // hoặc chỉ trả về status 200 OK mà không có body.
      // Chúng ta sẽ cố gắng đọc data nhưng cũng kiểm tra res.ok.
      const data = res.headers.get("content-type")?.includes("application/json") ? await res.json() : {};

      if (res.ok) {
        message.success('Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email của bạn để lấy mã xác thực.');
        
        // --- ĐÂY LÀ PHẦN ĐÃ ĐƯỢC THÊM LẠI ĐỂ CHUYỂN HƯỚNG ---
        navigate('/reset-password', { state: { email: email } });
        // ----------------------------------------------------

      } else {
        message.error(data.message || "Yêu cầu đặt lại mật khẩu thất bại!");
      }
    } catch (networkError) {
      message.error("Lỗi mạng: Không thể kết nối đến máy chủ!");
      console.error("Network error:", networkError);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Quên mật khẩu?</h3>
      <p style={{ textAlign: 'center', marginBottom: 20, color: '#555' }}>
        Vui lòng nhập địa chỉ email bạn đã đăng ký tài khoản. Chúng tôi sẽ gửi mã xác thực đặt lại mật khẩu cho bạn.
      </p>
      <Form
        name="forgot_password"
        onFinish={onFinish}
        layout="vertical"
      >
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập Email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Email của bạn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Gửi yêu cầu
          </Button>
        </Form.Item>
      </Form>

      <p style={{ marginTop: 15, textAlign: 'center' }}>
        <a onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#1890ff' }}>Quay lại Đăng nhập</a>
      </p>
    </div>
  );
};

export default ForgotPassword;