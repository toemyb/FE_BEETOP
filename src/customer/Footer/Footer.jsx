import React from "react";
import { Row, Col } from "antd";
import {
    FacebookFilled,
    YoutubeFilled,
    InstagramFilled,
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
} from "@ant-design/icons";
import "./Footer.css";

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-content">
                <Row gutter={[32, 32]} justify="center" align="top">
                    {/* Cột 1: Logo & giới thiệu */}
                    <Col xs={24} sm={12} md={6} className="footer-column">
                        <h3>🛍️ BeeTop</h3>
                        <p>
                            Cung cấp laptop chính hãng, giá tốt, bảo hành tận tâm.
                            Uy tín hàng đầu Việt Nam.
                        </p>
                    </Col>

                    {/* Cột 2: Liên kết nhanh */}
                    <Col xs={24} sm={12} md={6} className="footer-column">
                        <h4>Liên kết nhanh</h4>
                        <ul>
                            <li><a href="/">Trang chủ</a></li>
                            <li><a href="/products">Sản phẩm</a></li>
                            <li><a href="/about">Giới thiệu</a></li>
                            <li><a href="/contact">Liên hệ</a></li>
                        </ul>
                    </Col>

                    {/* Cột 3: Thông tin liên hệ */}
                    <Col xs={24} sm={12} md={6} className="footer-column">
                        <h4>Liên hệ</h4>
                        <p><EnvironmentOutlined /> 123 Nguyễn Văn Linh, Hà Nội</p>
                        <p><PhoneOutlined /> 0987 654 321</p>
                        <p><MailOutlined /> support@beelaptop.vn</p>
                    </Col>

                    {/* Cột 4: Mạng xã hội */}
                    <Col xs={24} sm={12} md={6} className="footer-column">
                        <h4>Kết nối với chúng tôi</h4>
                        <div className="footer-socials">
                            <a href="https://facebook.com" target="_blank" rel="noreferrer">
                                <FacebookFilled />
                            </a>
                            <a href="https://instagram.com" target="_blank" rel="noreferrer">
                                <InstagramFilled />
                            </a>
                            <a href="https://youtube.com" target="_blank" rel="noreferrer">
                                <YoutubeFilled />
                            </a>
                        </div>
                    </Col>
                </Row>
            </div>

            {/* Dòng bản quyền cuối cùng */}
            <div className="footer-bottom">
                <p>© {new Date().getFullYear()} BeeTop. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
