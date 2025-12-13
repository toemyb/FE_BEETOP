import React, { useState } from "react";
import { Form, Input, Button, Checkbox, message } from "antd";
import { UserOutlined, LockOutlined, GoogleOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../../service/api";
import "./Auth.css";

const Login = ({ setToken, setUser }) => {
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const setAuthStorage = (data, meta, values) => {
    const { accessToken, refreshToken } = meta.tokenInfo;

    // token
    sessionStorage.setItem("accessToken", accessToken);
    sessionStorage.setItem("refreshToken", refreshToken);
    setToken(accessToken);

    // id
    sessionStorage.setItem("idTaiKhoan", data.id);
    localStorage.setItem("customerId", data.id);

    // dọn key cũ tránh /cart/null
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
    setUser(loggedInUser);

    // role check
    const isKhachHang =
      roleRaw.includes("KHACH") ||
      roleRaw.includes("CUSTOMER") ||
      roleRaw === "USER";

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
    <div className="authPage">
      <div className="authShell">
        <div className="authBrand">
          <div className="brandTop">
            <div className="brandIcon">💻</div>
            <div>
              <div className="brandName">BeeLaptop</div>
              <div className="brandSub">Laptop chính hãng • Giá tốt • Bảo hành rõ</div>
            </div>
          </div>
          <div className="brandTitle">Welcome back</div>
          <ul className="brandList">
            <li>Lưu giỏ hàng & theo dõi đơn</li>
            <li>Nhận voucher & ưu đãi riêng</li>
            <li>Hỗ trợ nhanh khi cần</li>
          </ul>
          <div className="brandNote">Tip: đăng nhập để đồng bộ giỏ hàng giữa các thiết bị.</div>
        </div>

        <div className="authPanel">
          <div className="panelHead">
            <h2>Đăng nhập</h2>
            <p>Nhập thông tin để tiếp tục</p>
          </div>

          <Form layout="vertical" onFinish={handleSubmit} autoComplete="on">
            <Form.Item
              label="Email / Số điện thoại"
              name="username"
              rules={[{ required: true, message: "Vui lòng nhập Email hoặc SĐT!" }]}
            >
              <Input
                size="large"
                className="authInputRound"
                prefix={<UserOutlined />}
                placeholder="email@gmail.com / 09xx..."
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[{ required: true, message: "Vui lòng nhập mật khẩu!" }]}
            >
              <Input.Password
                size="large"
                className="authInputRound"
                prefix={<LockOutlined />}
                placeholder="Nhập mật khẩu"
              />
            </Form.Item>

            {err && <div className="formError">{err}</div>}

            <div className="rowBetween">
              <Checkbox>Ghi nhớ</Checkbox>
              <button type="button" className="linkBtn" onClick={() => navigate("/forgot-password")}>
                Quên mật khẩu?
              </button>
            </div>

            <Button type="primary" htmlType="submit" size="large" className="btnFull">
              Đăng nhập
            </Button>

            <div className="hrText">Hoặc</div>

            <Button
              size="large"
              className="btnGhost"
              icon={<GoogleOutlined />}
              onClick={() =>
                (window.location.href = "http://localhost:8080/oauth2/authorization/google")
              }
            >
              Tiếp tục với Google
            </Button>

            <div className="bottomText">
              Chưa có tài khoản?{" "}
              <button type="button" className="linkBtn" onClick={() => navigate("/register")}>
                Đăng ký
              </button>
              {" · "}
              <button type="button" className="linkBtn" onClick={() => navigate("/")}>
                Về trang chủ
              </button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
