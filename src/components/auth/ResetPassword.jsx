// components/auth/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { Form, Input, Button, message } from "antd";
import { MailOutlined, LockOutlined, KeyOutlined } from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../service/api";
import "./Auth.css";
import beeTopLogo from "../../img/BeeTop2.png";

const ResetPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  // Prefill email từ ForgotPassword
  useEffect(() => {
    const email = location?.state?.email;
    if (email) form.setFieldsValue({ email });
  }, [location?.state, form]);

  const onFinish = async (values) => {
    const payload = {
      email: values.email?.trim(),
      resetToken: values.resetToken?.trim(),
      newMatKhau: values.newMatKhau,
    };

    try {
      setLoading(true);
      const res = await api.post("/auth/reset-password", payload);

      message.success(res?.data?.message || "Đổi mật khẩu thành công!");
      form.resetFields();
      setTimeout(() => navigate("/login"), 800);
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra mã xác thực.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPageLite">
      <div className="authCardWhite">
        <div className="authHeader">
          <img className="authLogo" src={beeTopLogo} alt="BeeTop" />
          <h2 className="authTitle">Đặt lại mật khẩu</h2>
          <p className="authSub">Nhập mã xác thực đã gửi về email và mật khẩu mới</p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          {/* Email */}
          <Form.Item
            label="Email"
            name="email"
            normalize={(v) => (typeof v === "string" ? v.trim() : v)}
            rules={[
              { required: true, message: "Vui lòng nhập Email!" },
              { type: "email", message: "Email không hợp lệ!" },
              { max: 254, message: "Email quá dài!" },
              () => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  if (/\s/.test(value)) {
                    return Promise.reject(new Error("Email không được chứa khoảng trắng!"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input
              className="authInput"
              prefix={<MailOutlined />}
              placeholder="example@gmail.com"
              inputMode="email"
              autoComplete="email"
            />
          </Form.Item>

          {/* Mã xác thực */}
          <Form.Item
            label="Mã xác thực"
            name="resetToken"
            normalize={(v) => (typeof v === "string" ? v.trim() : v)}
            rules={[
              { required: true, message: "Vui lòng nhập mã xác thực!" },
              { min: 4, message: "Mã xác thực quá ngắn!" },
              { max: 64, message: "Mã xác thực quá dài!" },
              () => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  if (/\s/.test(value)) {
                    return Promise.reject(new Error("Mã xác thực không được chứa khoảng trắng!"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input
              className="authInput"
              prefix={<KeyOutlined />}
              placeholder="Nhập mã xác thực từ email"
              autoComplete="one-time-code"
            />
          </Form.Item>

          {/* Mật khẩu mới */}
          <Form.Item
            label="Mật khẩu mới"
            name="newMatKhau"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 8, message: "Mật khẩu phải có ít nhất 8 ký tự!" },
              () => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  if (/\s/.test(value)) {
                    return Promise.reject(new Error("Mật khẩu không được chứa khoảng trắng!"));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          {/* Xác nhận mật khẩu */}
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmNewMatKhau"
            dependencies={["newMatKhau"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newMatKhau") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
              autoComplete="new-password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="authBtn"
            loading={loading}
          >
            Đổi mật khẩu
          </Button>

          <div className="authBottom">
            <button type="button" className="authLink" onClick={() => navigate("/login")}>
              Quay lại đăng nhập
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
