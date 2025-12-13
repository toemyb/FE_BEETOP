import React, { useState, useEffect } from "react";
import { Row, Col, Button, Typography, Card, List, message, Badge, Divider, Tag, Space } from "antd";
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    GiftFilled,
    ShoppingCartOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
    TagFilled,
    ThunderboltFilled,
    FireOutlined,
    StarFilled,
    HeartOutlined,
    ShareAltOutlined,
    ZoomInOutlined,
    TruckOutlined,
    ReloadOutlined,
    SafetyOutlined,
} from "@ant-design/icons";
import { useParams, useNavigate } from "react-router-dom";
import { CustomerLaptopDetail } from "../../service/LapTopService";
import "./ProductDetailPage.css";
import { addToCart } from "../../service/CartCustomerService";
const { Title, Text } = Typography;

const ProductDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [images, setImages] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [variants, setVariants] = useState([]);
    const [productDetail, setProductDetail] = useState(null);
    const [selectedConfig, setSelectedConfig] = useState("");
    const [isCustomer, setIsCustomer] = useState(false);
    const [imageZoom, setImageZoom] = useState(false);

    useEffect(() => {
        const customerStatus = localStorage.getItem("isCustomer") === "true";
        setIsCustomer(customerStatus);
    }, []);

    // Cuộn lên đầu trang khi vào trang hoặc khi id thay đổi
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [id]);

    const getIdTaiKhoan = () =>
        sessionStorage.getItem("idTaiKhoan") || localStorage.getItem("customerId");

    const addCart = async () => {
        if (!isCustomer) {
            message.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            navigate("/login");
            return;
        }

        const idTaiKhoan = getIdTaiKhoan();
        if (!idTaiKhoan) {
            message.error("Không tìm thấy id tài khoản, vui lòng đăng nhập lại!");
            return;
        }

        if (!productDetail?.ctId) {
            message.error("Không xác định được phiên bản sản phẩm (ctId).");
            return;
        }

        const cartItem = {
            idTaiKhoan,
            idSpct: productDetail.ctId,
            soLuong: 1,
        };

        try {
            await addToCart(cartItem);
            message.success("Thêm sản phẩm vào giỏ hàng thành công!");
        } catch (error) {
            // chỉ báo “đã có trong giỏ” khi BE thật sự trả thông báo đó
            const msg = error?.response?.data?.message || error?.message || "";
            if (String(msg).toLowerCase().includes("đã có trong giỏ")) {
                message.warning("Sản phẩm đã có trong giỏ hàng");
            } else {
                message.error("Thêm vào giỏ thất bại!");
            }
        }
    };

    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const data = await CustomerLaptopDetail(id);

                // Lọc chỉ hiển thị sản phẩm có trangThaiSeri === 1
                const availableVariants = data.filter(item => item.trangThaiSeri === 1);
                setVariants(availableVariants);

                if (availableVariants.length === 0) {
                    message.warning("Sản phẩm hiện không còn hàng");
                    return;
                }

                const urlParams = new URLSearchParams(window.location.search);
                const ctIdParam = urlParams.get("ctId");

                const current =
                    ctIdParam && availableVariants.find((x) => x.ctId === ctIdParam)
                        ? availableVariants.find((x) => x.ctId === ctIdParam)
                        : availableVariants[0];

                if (!current) {
                    message.warning("Sản phẩm hiện không còn hàng");
                    return;
                }

                setProductDetail(current);
                setSelectedConfig(current.ctId);

                // xử lý ảnh
                const imgList = current.images && Array.isArray(current.images) && current.images.length > 0
                    ? current.images
                    : current.image
                        ? [current.image]
                        : [];

                setImages(imgList);
                setSelectedImage(imgList.length > 0 ? imgList[0] : null);
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết:", error);
            }
        };

        fetchProductDetail();
    }, [id]);

    // Chọn cấu hình
    const handleSelectConfig = (item) => {
        setSelectedConfig(item.ctId);
        setProductDetail(item);

        // Cập nhật ảnh khi chuyển variant
        const imgList = item.images && Array.isArray(item.images) && item.images.length > 0
            ? item.images
            : item.image
                ? [item.image]
                : [];

        setImages(imgList);
        setSelectedImage(imgList.length > 0 ? imgList[0] : null);

        navigate(`/product-detail/${id}?ctId=${item.ctId}`, { replace: true });
    };

    // Mua ngay
    const handleBuyNow = async () => {
        if (!productDetail) return;

        const idTaiKhoan = getIdTaiKhoan();

        if (isCustomer && idTaiKhoan) {
            // Nếu đã đăng nhập: thêm vào giỏ hàng qua API
            try {
                const cartItem = {
                    idTaiKhoan,
                    idSpct: productDetail.ctId,
                    soLuong: 1,
                };

                await addToCart(cartItem);

                sessionStorage.setItem(
                    "buyNow",
                    JSON.stringify({
                        enabled: true,
                        productId: productDetail.ctId,
                        timestamp: Date.now(),
                    })
                );

                navigate("/cart");
            } catch (error) {
                console.error("Lỗi khi thêm vào giỏ hàng:", error);
                message.error("Lỗi khi thêm sản phẩm vào giỏ hàng");
            }
        } else {
            // Nếu chưa đăng nhập: thêm vào localStorage
            let existing = JSON.parse(localStorage.getItem("orderProduct") || "[]");

            const firstImage = productDetail.images && Array.isArray(productDetail.images) && productDetail.images.length > 0
                ? productDetail.images[0]
                : selectedImage || productDetail.image || null;

            const newCartItem = {
                id: id,
                idSpct: productDetail.ctId,
                name: productDetail.productName,
                cpu: productDetail.cpu,
                ram: productDetail.ram,
                ssd: productDetail.ssd,
                card: productDetail.card,
                price: productDetail.price,
                color: productDetail.color,
                image: firstImage,
                quantity: 1,
            };

            existing.push(newCartItem);
            localStorage.setItem("orderProduct", JSON.stringify(existing));

            // Lưu flag để CartPage tự động chuyển đến bước thanh toán
            sessionStorage.setItem("buyNow", JSON.stringify({
                enabled: true,
                productId: newCartItem.id || newCartItem.idSpct,
                timestamp: Date.now()
            }));

            navigate("/cart");
        }
    };

    if (!productDetail) {
        return (
            <div className="product-detail-wrapper">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <Text>Đang tải thông tin sản phẩm...</Text>
                </div>
            </div>
        );
    }

    const specsQuickView = [
        { label: "CPU", value: productDetail.cpu, icon: <ThunderboltFilled /> },
        { label: "RAM", value: productDetail.ram, icon: <ThunderboltFilled /> },
        { label: "SSD", value: productDetail.ssd, icon: <ThunderboltFilled /> },
        { label: "Card đồ họa", value: productDetail.card, icon: <ThunderboltFilled /> },
        { label: "Màn hình", value: productDetail.display || productDetail.resolution || "Đang cập nhật", icon: <ThunderboltFilled /> },
    ];

    const policies = [
        { icon: <SafetyOutlined />, text: "Bảo hành chính hãng 36 tháng" },
        { icon: <ReloadOutlined />, text: "1 đổi 1 trong 14 ngày đầu" },
        { icon: <TruckOutlined />, text: "Miễn phí giao hàng toàn quốc" },
        { icon: <GiftFilled />, text: "Trả góp 0% lãi suất" },
    ];

    const gifts = [
        "Tặng balo laptop cao cấp",
        "Tặng chuột không dây",
        "Cài đặt Windows + Office miễn phí",
        "Giảm 500k khi mua kèm màn hình",
    ];

    return (
        <div className="product-detail-wrapper">
            {/* Breadcrumb */}
            <div className="breadcrumb-section">
                <Text type="secondary">Trang chủ / Laptop / {productDetail.productName?.substring(0, 30)}...</Text>
            </div>

            <Row gutter={[32, 32]}>
                {/* CỘT TRÁI: TÊN -> ẢNH -> THÔNG SỐ -> MÔ TẢ */}
                <Col xs={24} lg={12}>
                    {/* Tên sản phẩm */}
                    <div className="product-title-left">
                        <Title level={2} className="product-name-left">
                            {productDetail.productName}
                        </Title>
                        <div className="product-subtitle-left">
                            {productDetail.cpu} • {productDetail.ram} • {productDetail.ssd} • {productDetail.card}
                        </div>
                        <div className="product-badges-left">
                            <Tag color="green" icon={<CheckCircleFilled />}>Còn hàng</Tag>
                            <Tag color="blue" icon={<FireOutlined />}>Sản phẩm mới</Tag>
                            <Tag color="gold" icon={<StarFilled />}>Bán chạy</Tag>
                        </div>
                    </div>

                    {/* Ảnh chính */}
                    <div className="image-gallery">
                        <div className="main-image-container" onClick={() => setImageZoom(!imageZoom)}>
                            <Badge.Ribbon text="HOT" color="red">
                                <div className="main-image-wrapper">
                                    <img
                                        src={selectedImage || (productDetail.images && productDetail.images.length > 0 ? productDetail.images[0] : productDetail.image)}
                                        alt={productDetail.productName}
                                        className={`main-image ${imageZoom ? 'zoomed' : ''}`}
                                    />
                                    {imageZoom && (
                                        <div className="zoom-overlay" onClick={(e) => { e.stopPropagation(); setImageZoom(false); }}>
                                            <ZoomInOutlined className="zoom-icon" />
                                        </div>
                                    )}
                                </div>
                            </Badge.Ribbon>
                            <div className="image-actions">
                                <Button
                                    type="text"
                                    icon={<HeartOutlined />}
                                    className="action-btn"
                                    title="Yêu thích"
                                />
                                <Button
                                    type="text"
                                    icon={<ShareAltOutlined />}
                                    className="action-btn"
                                    title="Chia sẻ"
                                />
                            </div>
                        </div>

                        {/* Thumbnail list */}
                        <div className="thumbnail-list">
                            {images.map((img, index) => (
                                <div
                                    key={index}
                                    className={`thumbnail-item ${selectedImage === img ? "active" : ""}`}
                                    onClick={() => setSelectedImage(img)}
                                >
                                    <img src={img} alt={`Thumbnail ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Thông số kỹ thuật */}
                    <Card
                        className="specs-card"
                        title={
                            <Space>
                                <ThunderboltFilled className="spec-icon" />
                                <span>Thông số kỹ thuật</span>
                            </Space>
                        }
                    >
                        <div className="specs-grid">
                            {specsQuickView.map((spec, index) => (
                                <div key={index} className="spec-item">
                                    <div className="spec-label">
                                        <span className="spec-icon-small">{spec.icon}</span>
                                        <Text strong>{spec.label}:</Text>
                                    </div>
                                    <Text className="spec-value">{spec.value}</Text>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Mô tả sản phẩm */}
                    <Card
                        className="description-card"
                        title="Mô tả sản phẩm"
                    >
                        <div className="product-description">
                            <Text>{productDetail.description || "Sản phẩm chất lượng cao, đảm bảo chính hãng với đầy đủ phụ kiện và bảo hành."}</Text>
                        </div>
                    </Card>
                </Col>

                {/* CỘT PHẢI: GIÁ -> PHIÊN BẢN -> MUA NGAY -> CHÍNH SÁCH -> CỬA HÀNG */}
                <Col xs={24} lg={12}>
                    {/* Giá */}
                    <div className="price-section">
                        <div className="price-main">
                            <Text className="price-currency">₫</Text>
                            <Text className="price-value">{productDetail.price.toLocaleString()}</Text>
                        </div>
                        <div className="price-info">
                            <Tag color="red" className="discount-tag">
                                <FireOutlined /> Tiết kiệm 20% khi thu cũ đổi mới
                            </Tag>
                            <Text type="secondary" className="trade-in-price">
                                Giá thu cũ chỉ từ: <Text strong className="trade-in-value">{(productDetail.price * 0.8).toLocaleString()} ₫</Text>
                            </Text>
                        </div>
                    </div>

                    {/* Chọn cấu hình - Phiên bản */}
                    <div className="variant-section">
                        <Title level={4} className="section-title">
                            <ThunderboltFilled className="title-icon" />
                            Chọn phiên bản
                        </Title>
                        <div className="variant-list">
                            {variants.map((item) => (
                                <div
                                    key={item.ctId}
                                    className={`variant-item ${selectedConfig === item.ctId ? "active" : ""}`}
                                    onClick={() => handleSelectConfig(item)}
                                >
                                    <div className="variant-content">
                                        <div className="variant-spec-row">
                                            <Text strong className="variant-spec">
                                                {item.ram} / {item.ssd}
                                            </Text>
                                            {selectedConfig === item.ctId && (
                                                <CheckCircleFilled className="check-icon" />
                                            )}
                                        </div>
                                        <Text type="secondary" className="variant-detail">
                                            {item.cpu} • {item.card}
                                        </Text>
                                        <div className="variant-price">
                                            {item.price.toLocaleString()} ₫
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="action-buttons">
                        <Button
                            type="primary"
                            size="large"
                            danger
                            className="btn-buy-now"
                            onClick={handleBuyNow}
                            block
                        >
                            <div className="btn-content">
                                <Text strong className="btn-title">MUA NGAY</Text>
                                <Text className="btn-subtitle">Giao hàng miễn phí hoặc nhận tại cửa hàng</Text>
                            </div>
                        </Button>

                        <div className="secondary-buttons">
                            <Button
                                size="large"
                                className="btn-add-cart"
                                onClick={addCart}
                                icon={<ShoppingCartOutlined />}
                                block
                            >
                                Thêm vào giỏ hàng
                            </Button>
                            <Button
                                size="large"
                                className="btn-contact"
                                icon={<PhoneOutlined />}
                                block
                            >
                                Gọi tư vấn
                            </Button>
                        </div>
                    </div>

                    {/* Chính sách */}
                    <div className="policies-section">
                        <Title level={4} className="section-title">
                            <SafetyCertificateFilled className="title-icon" />
                            Chính sách & Ưu đãi
                        </Title>
                        <div className="policies-grid">
                            {policies.map((policy, index) => (
                                <div key={index} className="policy-item">
                                    <div className="policy-icon">{policy.icon}</div>
                                    <Text>{policy.text}</Text>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quà tặng */}
                    <Card className="gift-card" size="small">
                        <div className="gift-header">
                            <GiftFilled className="gift-icon" />
                            <Text strong>Quà tặng kèm theo</Text>
                        </div>
                        <List
                            size="small"
                            dataSource={gifts}
                            renderItem={(item) => (
                                <List.Item className="gift-item">
                                    <CheckCircleFilled className="gift-check" />
                                    <Text>{item}</Text>
                                </List.Item>
                            )}
                        />
                    </Card>

                    {/* Buttons */}


                    {/* Cửa hàng */}
                    <Card className="store-card" size="small" title={
                        <Space>
                            <EnvironmentOutlined />
                            <span>Hệ thống cửa hàng</span>
                        </Space>
                    }>
                        <List
                            size="small"
                            dataSource={[
                                { address: "114 Hàm Nghi, Đà Nẵng", phone: "0898 143 789" },
                                { address: "484 Núi Thành, Đà Nẵng", phone: "0705 485 005" },
                                { address: "603 Tôn Đức Thắng, Đà Nẵng", phone: "0765 143 789" },
                            ]}
                            renderItem={(store, index) => (
                                <List.Item className="store-item">
                                    <List.Item.Meta
                                        title={<Text strong>{store.address}</Text>}
                                        description={
                                            <Space>
                                                <PhoneOutlined />
                                                <Text>{store.phone}</Text>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ProductDetailPage;
