// components/auth/ForgotPassword.jsx
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import "./Auth.css";
import beeTopLogo from "../../img/BeeTop2.png";

const ForgotPassword = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    const email = values.email?.trim();

    try {
      setLoading(true);

      // ✅ backend: POST /auth/forgot-password  body: { email }
      const res = await api.post("/auth/forgot-password", { email });

      message.success(
        res?.data?.message ||
          "Yêu cầu đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra email để lấy mã xác thực."
      );

      // chuyển sang reset-password và điền sẵn email
      navigate("/reset-password", { state: { email } });
    } catch (error) {
      const msg =
        error?.response?.data?.message || "Yêu cầu đặt lại mật khẩu thất bại!";
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
          <h2 className="authTitle">Quên mật khẩu?</h2>
          <p className="authSub">
            Nhập email đã đăng ký, BeeTop sẽ gửi mã xác thực để đặt lại mật khẩu.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            normalize={(v) => (typeof v === "string" ? v.trim() : v)}
            rules={[
              { required: true, message: "Vui lòng nhập Email!" },
              { type: "email", message: "Email không hợp lệ!" },
              { max: 254, message: "Email quá dài!" },
              // chặn khoảng trắng trong email
              () => ({
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  if (/\s/.test(value)) {
                    return Promise.reject(
                      new Error("Email không được chứa khoảng trắng!")
                    );
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

          <Button
            type="primary"
            htmlType="submit"
            size="large"
            className="authBtn"
            loading={loading}
          >
            Gửi mã xác thực
          </Button>

          <div className="authBottom">
            <button
              type="button"
              className="authLink"
              onClick={() => navigate("/login")}
            >
              Quay lại đăng nhập
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ForgotPassword;
