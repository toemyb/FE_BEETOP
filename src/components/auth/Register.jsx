import React, { useState } from "react";
import { message, Form, Input, Button, DatePicker, Radio } from "antd";
import { useNavigate } from "react-router-dom";
import {
  MailOutlined,
  LockOutlined,
  EditOutlined,
  CalendarOutlined,
  PhoneOutlined,
  ManOutlined,
  WomanOutlined,
} from "@ant-design/icons";
import "./Auth.css";
import beeTopLogo from "../../img/BeeTop2.png";
import api from "../../service/api";

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const { ten, email, soDienThoai, matKhau, ngaySinh, gioiTinh } = values;
    const formattedNgaySinh = ngaySinh ? ngaySinh.format("YYYY-MM-DD") : null;

    try {
      setLoading(true);

      // ✅ dùng api giống login cho đồng bộ baseURL
      const res = await api.post("/auth/signup", {
        ten,
        email,
        soDienThoai,
        matKhau,
        ngaySinh: formattedNgaySinh,
        gioiTinh,
      });

      if (res?.status === 200 || res?.status === 201) {
        message.success("Đăng ký thành công! Vui lòng đăng nhập.");
        form.resetFields();
        navigate("/login");
      } else {
        message.error(res?.data?.message || "Đăng ký thất bại!");
      }
    } catch (e) {
      message.error(e?.response?.data?.message || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPageLite">
      <div className="authCardWhite">
        <div className="authHeader">
          <img className="authLogo" src={beeTopLogo} alt="BeeTop" />
          <h2 className="authTitle">Đăng ký</h2>
          <p className="authSub">Tạo tài khoản BeeTop</p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Họ và tên"
            name="ten"
            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
          >
            <Input className="authInput" prefix={<EditOutlined />} placeholder="Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập Email!" },
              { type: "email", message: "Email không hợp lệ!" },
            ]}
          >
            <Input className="authInput" prefix={<MailOutlined />} placeholder="example@gmail.com" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="soDienThoai"
            rules={[
              { required: true, message: "Vui lòng nhập số điện thoại!" },
              { pattern: /^[0-9]{10,11}$/, message: "Số điện thoại không hợp lệ!" },
            ]}
          >
            <Input className="authInput" prefix={<PhoneOutlined />} placeholder="09xx..." />
          </Form.Item>

          <Form.Item
            label="Ngày sinh"
            name="ngaySinh"
            rules={[{ required: true, message: "Vui lòng chọn ngày sinh!" }]}
          >
            <DatePicker
              className="authInput"
              format="DD/MM/YYYY"
              placeholder="Chọn ngày sinh"
              style={{ width: "100%" }}
              suffixIcon={<CalendarOutlined />}
            />
          </Form.Item>

          <Form.Item
            label="Giới tính"
            name="gioiTinh"
            rules={[{ required: true, message: "Vui lòng chọn giới tính!" }]}
          >
            <Radio.Group>
              <Radio value="Nam">
                <ManOutlined /> Nam
              </Radio>
              <Radio value="Nữ">
                <WomanOutlined /> Nữ
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="matKhau"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu!" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
            ]}
            hasFeedback
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
            />
          </Form.Item>


          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmMatKhau"
            dependencies={["matKhau"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("matKhau") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password className="authInput" prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Button type="primary" htmlType="submit" size="large" className="authBtn" loading={loading}>
            Đăng ký
          </Button>

          <div className="authBottom">
            Đã có tài khoản?{" "}
            <button type="button" className="authLink" onClick={() => navigate("/login")}>
              Đăng nhập
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register;
