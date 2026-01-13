// components/ChangePassword.jsx
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import "./Auth.css";
import beeTopLogo from "../../img/BeeTop2.png";

const ChangePassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const accessToken = sessionStorage.getItem("accessToken");
    if (!accessToken) {
      message.error("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn.");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      // ✅ backend: POST /auth/change-password
      const res = await api.post(
        "/auth/change-password",
        {
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      message.success(res?.data?.message || "Đổi mật khẩu thành công!");
      form.resetFields();

      // ✅ Tuỳ bạn: ép đăng nhập lại sau khi đổi mật khẩu
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      navigate("/login");
    } catch (error) {
      const msg =
        error?.response?.data?.message ||
        "Đổi mật khẩu thất bại. Vui lòng kiểm tra mật khẩu hiện tại.";
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
          <h2 className="authTitle">Đổi mật khẩu</h2>
          <p className="authSub">Cập nhật mật khẩu để bảo mật tài khoản</p>
        </div>

        <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
          {/* Mật khẩu hiện tại */}
          <Form.Item
            label="Mật khẩu hiện tại"
            name="currentPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu hiện tại!" }]}
            hasFeedback
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </Form.Item>

          {/* Mật khẩu mới */}
          <Form.Item
            label="Mật khẩu mới"
            name="newPassword"
            dependencies={["currentPassword"]}
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu mới!" },
              { min: 8, message: "Mật khẩu mới phải có ít nhất 8 ký tự!" },
              // (Tuỳ chọn) Không cho trùng mật khẩu cũ
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const current = getFieldValue("currentPassword");
                  if (!value || !current || value !== current) return Promise.resolve();
                  return Promise.reject(
                    new Error("Mật khẩu mới không được trùng mật khẩu hiện tại!")
                  );
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập mật khẩu mới"
            />
          </Form.Item>

          {/* Xác nhận mật khẩu mới */}
          <Form.Item
            label="Xác nhận mật khẩu mới"
            name="confirmPassword"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password
              className="authInput"
              prefix={<LockOutlined />}
              placeholder="Nhập lại mật khẩu mới"
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
            <button type="button" className="authLink" onClick={() => navigate(-1)}>
              Quay lại
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ChangePassword;
