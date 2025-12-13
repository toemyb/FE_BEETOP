import React from "react";
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  EditOutlined,
  CalendarOutlined,
  PhoneOutlined,
  ManOutlined,
  WomanOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { Input, Button, Form, DatePicker, Radio } from 'antd';

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    // IMPORTANT: Extract 'ten' here, not 'hoVaTen'
    const { ten, email, soDienThoai,matKhau, ngaySinh,  gioiTinh } = values;

    const formattedNgaySinh = ngaySinh ? ngaySinh.format('YYYY-MM-DD') : null;

    try {
      const res = await fetch("/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ten, // <--- NOW SENDING 'ten' directly to match backend DTO
          email,
          soDienThoai,
          matKhau,
          ngaySinh: formattedNgaySinh,
          gioiTinh,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        form.resetFields();
        navigate('/login');
      } else {
        message.error(data.message || "Đăng ký thất bại!");
      }
    } catch (networkError) {
      message.error("Lỗi mạng: Không thể kết nối đến máy chủ!");
      console.error("Network error:", networkError);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #d9d9d9', borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>Đăng ký tài khoản mới</h3>
      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        initialValues={{ remember: true }}
        layout="vertical"
      >

        {/* Họ và tên (NOW named 'ten' to match backend DTO) */}
        <Form.Item
          name="ten" // <--- CHANGED FROM 'hoVaTen' TO 'ten'
          rules={[{ required: true, message: 'Vui lòng nhập Họ và tên của bạn!' }]}
        >
          <Input prefix={<EditOutlined />} placeholder="Họ và tên" />
        </Form.Item>

        {/* Địa chỉ Email */}
        <Form.Item
          name="email"
          rules={[
            { required: true, message: 'Vui lòng nhập Email!' },
            { type: 'email', message: 'Email không hợp lệ!' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="Địa chỉ Email (VD: example@gmail.com)" />
        </Form.Item>

        
        {/* Số điện thoại */}
        <Form.Item
          name="soDienThoai"
          rules={[
            { required: true, message: 'Vui lòng nhập Số điện thoại!' },
            { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
          ]}
        >
          <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
        </Form.Item>

        {/* Ngày sinh */}
        <Form.Item
          name="ngaySinh"
          rules={[{ required: true, message: 'Vui lòng chọn Ngày sinh!' }]}
        >
          <DatePicker
            format="DD/MM/YYYY"
            placeholder="Ngày sinh"
            style={{ width: '100%' }}
            suffixIcon={<CalendarOutlined />}
          />
        </Form.Item>

        {/* Giới tính */}
        <Form.Item
          name="gioiTinh"
          label="Giới tính"
          rules={[{ required: true, message: 'Vui lòng chọn Giới tính!' }]}
        >
          <Radio.Group>
            <Radio value="Nam"> <ManOutlined /> Nam </Radio>
            <Radio value="Nữ"> <WomanOutlined /> Nữ </Radio>
          </Radio.Group>
        </Form.Item>


        {/* Mật khẩu */}
        <Form.Item
          name="matKhau"
          rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu!' }]}
          hasFeedback
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
        </Form.Item>

        {/* Xác nhận mật khẩu */}
        <Form.Item
          name="confirmMatKhau"
          dependencies={['matKhau']}
          hasFeedback
          rules={[
            { required: true, message: 'Vui lòng xác nhận Mật khẩu!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('matKhau') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Xác nhận mật khẩu" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" style={{ width: '100%' }}>
            Đăng ký
          </Button>
        </Form.Item>
      </Form>

      <p style={{ marginTop: 15, textAlign: 'center' }}>
        Đã có tài khoản? <a onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#1890ff' }}>Đăng nhập ngay</a>
      </p>
    </div>
  );
};

export default Register;