// components/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { message } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { Input, Button, Form } from 'antd';
import { MailOutlined, LockOutlined, KeyOutlined } from '@ant-design/icons';

const ResetPassword = () => {
  const [formAntd] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation(); // Vẫn giữ để có thể điền sẵn email nếu muốn

  const [formState, setFormState] = useState({
    email: "",
    resetToken: "", // Đây là nơi người dùng sẽ nhập mã xác thực từ email
    newMatKhau: "",
    confirmNewMatKhau: ""
  });

  // Sử dụng useEffect để điền sẵn email nếu được truyền từ trang ForgotPassword (tùy chọn)
  // Lưu ý: Với backend hiện tại, việc này không bắt buộc vì mã xác thực là do người dùng tự nhập.
  // Tuy nhiên, nó có thể tiện lợi cho người dùng.
  useEffect(() => {
    if (location.state && location.state.email) {
      setFormState(prevState => ({
        ...prevState,
        email: location.state.email
      }));
      formAntd.setFieldsValue({
        email: location.state.email
      });
    }
  }, [location.state, formAntd]);

  const handleChange = e => setFormState({ ...formState, [e.target.name]: e.target.value });

  const onFinish = async (values) => {
    try {
      // Đảm bảo tên trường khớp với ResetPasswordRequest DTO của backend
      // Backend của bạn mong đợi { email, resetToken, newMatKhau }
      const res = await fetch("/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          resetToken: formState.resetToken, // Đây là mã xác thực người dùng nhập
          newMatKhau: formState.newMatKhau
        })
      });
      const data = await res.json();

      if (res.ok) {
        message.success(data.message || "Mật khẩu đã được đổi thành công!");
        formAntd.resetFields();
        setTimeout(() => navigate('/login'), 1000);
      } else {
        // Cần xử lý các mã lỗi cụ thể từ backend của bạn
        // Ví dụ: mã token không hợp lệ/hết hạn, email không khớp, v.v.
        // Bạn có thể dùng data.message để hiển thị lỗi chi tiết hơn
        message.error(data.message || "Đổi mật khẩu thất bại.");
      }
    } catch (networkError) {
      message.error("Lỗi mạng: Không thể kết nối đến máy chủ.");
      console.error("Network error:", networkError);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Đổi mật khẩu</h3>
      <Form
        form={formAntd}
        name="reset_password"
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
            placeholder="Email"
            name="email" // Thêm name prop
            value={formState.email}
            onChange={handleChange}
          />
        </Form.Item>

        {/* Thêm trường input cho Mã xác thực */}
        <Form.Item
          name="resetToken"
          rules={[{ required: true, message: 'Vui lòng nhập Mã xác thực!' }]}
        >
          <Input
            prefix={<KeyOutlined />}
            placeholder="Mã xác thực từ Email"
            name="resetToken" // Thêm name prop
            value={formState.resetToken}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.Item
          name="newMatKhau"
          rules={[
            { required: true, message: 'Vui lòng nhập Mật khẩu mới!' },
            { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' } // Thêm rule min length
          ]}
          hasFeedback
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Mật khẩu mới"
            name="newMatKhau" // Thêm name prop
            value={formState.newMatKhau}
            onChange={handleChange}
          />
        </Form.Item>

        <Form.Item
          name="confirmNewMatKhau"
          dependencies={['newMatKhau']}
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng xác nhận Mật khẩu mới!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newMatKhau') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Xác nhận mật khẩu mới"
            name="confirmNewMatKhau" // Thêm name prop
            // Không cần value và onChange ở đây vì Ant Design tự handle qua dependencies
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Đổi mật khẩu
          </Button>
        </Form.Item>
      </Form>

      <p style={{ marginTop: 15, textAlign: 'center' }}>
        <a onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#1890ff' }}>Quay lại Đăng nhập</a>
      </p>
    </div>
  );
};

export default ResetPassword;