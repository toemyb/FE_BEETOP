import React from "react";
import "./Auth.css";

const AuthLayout = ({
  title,
  subtitle,
  children,
  sideTitle = "BeeTop",
  sideSub = "Laptop chính hãng • Giá tốt • Bảo hành rõ",
  bullets = ["Lưu giỏ hàng & theo dõi đơn", "Nhận voucher & ưu đãi riêng", "Hỗ trợ nhanh khi cần"],
}) => {
  return (
    <div className="authPage">
      <div className="authBg" />
      <div className="authOverlay" />

      <div className="authShell">
        {/* LEFT BRAND */}
        <div className="authBrand">
          <div className="brandTop">
            <div className="brandIcon">💻</div>
            <div>
              <div className="brandName">{sideTitle}</div>
              <div className="brandSub">{sideSub}</div>
            </div>
          </div>

          <div className="brandTitle">Modern • Secure • Fast</div>

          <ul className="brandList">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>

          <div className="brandNote">
            Tip: đăng nhập để đồng bộ giỏ hàng giữa các thiết bị.
          </div>
        </div>

        {/* RIGHT GLASS PANEL */}
        <div className="authPanel">
          <div className="panelHead">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
