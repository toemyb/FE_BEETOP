import React, { useState, useEffect } from "react";
import { Row, Col, Button, Typography, Card, List, message, Badge, Tag, Space } from "antd";
import {
    CheckCircleFilled,
    SafetyCertificateFilled,
    GiftFilled,
    ShoppingCartOutlined,
    EnvironmentOutlined,
    PhoneOutlined,
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
import { addToCart, getCartItems } from "../../service/CartCustomerService";


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

    // ✅ giống CartPage: isCustomer lấy từ localStorage
    useEffect(() => {
        const customerStatus = localStorage.getItem("isCustomer") === "true";
        setIsCustomer(customerStatus);
    }, []);

    // ✅ giống CartPage: customerId lấy customerId hoặc idTaiKhoan
    const idCustomer =
        localStorage.getItem("customerId") ||
        sessionStorage.getItem("idTaiKhoan");

    // Cuộn lên đầu trang khi id thay đổi
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [id]);

    const safeGetImageList = (obj) => {
        const imgList =
            obj?.images && Array.isArray(obj.images) && obj.images.length > 0
                ? obj.images
                : obj?.image
                    ? [obj.image]
                    : [];
        return imgList.filter(Boolean);
    };

    // ✅ Thêm vào giỏ hàng (login)
    const handleAddCart = async () => {
        if (!isCustomer) {
            message.error("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
            navigate("/login");
            return;
        }
        if (!productDetail) return;

        if (!idCustomer || idCustomer === "null" || idCustomer === "undefined") {
            message.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
            navigate("/login");
            return;
        }

        const cartItem = {
            idTaiKhoan: idCustomer,
            idSpct: productDetail.ctId,
            soLuong: 1,
        };

        try {
            // ✅ 1) Check xem sản phẩm đã có trong giỏ chưa
            const cartRes = await getCartItems(idCustomer);
            const cartItems = cartRes?.sanPhams ?? [];

            const existed = cartItems.some((x) => String(x?.idSpct) === String(productDetail.ctId));
            if (existed) {
                message.info("Sản phẩm đã có trong giỏ hàng");
                return;
            }

            // ✅ 2) Chưa có thì mới cho add
            await addToCart(cartItem);
            message.success("Thêm sản phẩm vào giỏ hàng thành công!");
            window.dispatchEvent(new Event("cartUpdated"));
        } catch (error) {
            console.error("handleAddCart error:", error);
            message.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại!");
        }
    };

    // Load detail + variants
    useEffect(() => {
        const fetchProductDetail = async () => {
            try {
                const data = await CustomerLaptopDetail(id);

                // ✅ chỉ hiển thị variant còn hàng (trangThaiSeri === 1)
                const availableVariants = Array.isArray(data)
                    ? data.filter((item) => item?.trangThaiSeri === 1)
                    : [];

                setVariants(availableVariants);

                if (availableVariants.length === 0) {
                    message.warning("Sản phẩm hiện không còn hàng");
                    setProductDetail(null);
                    setImages([]);
                    setSelectedImage(null);
                    return;
                }

                // ctId param
                const urlParams = new URLSearchParams(window.location.search);
                const ctIdParam = urlParams.get("ctId");

                const current =
                    ctIdParam &&
                        availableVariants.find((x) => String(x.ctId) === String(ctIdParam))
                        ? availableVariants.find((x) => String(x.ctId) === String(ctIdParam))
                        : availableVariants[0];

                if (!current) {
                    message.warning("Sản phẩm hiện không còn hàng");
                    return;
                }

                setProductDetail(current);
                setSelectedConfig(current.ctId);

                const imgList = safeGetImageList(current);
                setImages(imgList);
                setSelectedImage(imgList.length > 0 ? imgList[0] : null);
            } catch (error) {
                console.error("Lỗi khi lấy chi tiết:", error);
                message.error("Không thể tải thông tin sản phẩm");
            }
        };

        fetchProductDetail();
    }, [id]);

    // Chọn cấu hình
    const handleSelectConfig = (item) => {
        setSelectedConfig(item.ctId);
        setProductDetail(item);

        const imgList = safeGetImageList(item);
        setImages(imgList);
        setSelectedImage(imgList.length > 0 ? imgList[0] : null);

        navigate(`/product-detail/${id}?ctId=${item.ctId}`, { replace: true });
    };

    // ✅ Mua ngay (theo đúng flow CartPage: set sessionStorage.buyNow)
    const handleBuyNow = async () => {
        if (!productDetail) return;

        // LOGIN
        if (isCustomer && idCustomer) {
            const cartItem = {
                idTaiKhoan: idCustomer,
                idSpct: productDetail.ctId,
                soLuong: 1,
            };

            try {
                const cartRes = await getCartItems(idCustomer);
                const cartItems = cartRes?.sanPhams ?? [];

                const existed = cartItems.some((x) => String(x?.idSpct) === String(productDetail.ctId));
                if (!existed) {
                    await addToCart(cartItem);
                } else {
                    message.info("Sản phẩm đã có trong giỏ hàng");
                }
            } catch (error) {
                console.warn("BuyNow check/add error:", error);
                // vẫn cho đi tiếp qua /cart
            }

            sessionStorage.setItem(
                "buyNow",
                JSON.stringify({
                    enabled: true,
                    productId: productDetail.ctId,
                    timestamp: Date.now(),
                })
            );

            navigate("/cart");
            return;
        }

        // GUEST (chưa login) -> lưu localStorage.orderProduct (CartPage đọc key này)
        const existing = JSON.parse(localStorage.getItem("orderProduct") || "[]");

        const imgList = safeGetImageList(productDetail);
        const firstImage = imgList[0] || selectedImage || null;

        const newCartItem = {
            id: String(id), // id route
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

        // ✅ nếu đã có idSpct rồi thì tăng quantity thay vì push trùng
        const idx = existing.findIndex(
            (x) => String(x.idSpct) === String(newCartItem.idSpct)
        );
        if (idx >= 0) {
            existing[idx] = {
                ...existing[idx],
                quantity: (existing[idx].quantity || 1) + 1,
            };
        } else {
            existing.push(newCartItem);
        }

        localStorage.setItem("orderProduct", JSON.stringify(existing));

        sessionStorage.setItem(
            "buyNow",
            JSON.stringify({
                enabled: true,
                productId: newCartItem.idSpct,
                timestamp: Date.now(),
            })
        );

        navigate("/cart");
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
            <div className="breadcrumb-section">
                <Text type="secondary">
                    Trang chủ / Laptop / {productDetail.productName?.substring(0, 30)}...
                </Text>
            </div>

            <Row gutter={[32, 32]}>
                {/* LEFT */}
                <Col xs={24} lg={12}>
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

                    <div className="image-gallery">
                        <div className="main-image-container" onClick={() => setImageZoom(!imageZoom)}>
                            <Badge.Ribbon text="HOT" color="red">
                                <div className="main-image-wrapper">
                                    <img
                                        src={selectedImage || images[0] || productDetail.image}
                                        alt={productDetail.productName}
                                        className={`main-image ${imageZoom ? "zoomed" : ""}`}
                                    />
                                    {imageZoom && (
                                        <div
                                            className="zoom-overlay"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setImageZoom(false);
                                            }}
                                        >
                                            <ZoomInOutlined className="zoom-icon" />
                                        </div>
                                    )}
                                </div>
                            </Badge.Ribbon>

                            <div className="image-actions">
                                <Button type="text" icon={<HeartOutlined />} className="action-btn" title="Yêu thích" />
                                <Button type="text" icon={<ShareAltOutlined />} className="action-btn" title="Chia sẻ" />
                            </div>
                        </div>

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

                    <Card className="description-card" title="Mô tả sản phẩm">
                        <div className="product-description">
                            <Text>
                                {productDetail.description ||
                                    "Sản phẩm chất lượng cao, đảm bảo chính hãng với đầy đủ phụ kiện và bảo hành."}
                            </Text>
                        </div>
                    </Card>
                </Col>

                {/* RIGHT */}
                <Col xs={24} lg={12}>
                    <div className="price-section">
                        <Text className="price-label">Giá sản phẩm</Text>
                        <div className="price-main">
                            <Text className="price-currency">₫</Text>
                            <Text className="price-value">{productDetail.price?.toLocaleString()}</Text>
                        </div>
                    </div>

                    <div className="variant-section">
                        <Title level={4} className="section-title">
                            <ThunderboltFilled className="title-icon" />
                            Chọn phiên bản
                        </Title>

                        <div className="variant-list">
                            {variants.map((item) => (
                                <div
                                    key={item.ctId}
                                    className={`variant-item ${String(selectedConfig) === String(item.ctId) ? "active" : ""}`}
                                    onClick={() => handleSelectConfig(item)}
                                >
                                    <div className="variant-content">
                                        <div className="variant-spec-row">
                                            <Text strong className="variant-spec">
                                                {item.ram} / {item.ssd}
                                            </Text>
                                            {String(selectedConfig) === String(item.ctId) && (
                                                <CheckCircleFilled className="check-icon" />
                                            )}
                                        </div>

                                        <Text type="secondary" className="variant-detail">
                                            {item.cpu} • {item.card}
                                        </Text>

                                        <div className="variant-price">{item.price.toLocaleString()} ₫</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

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
                                onClick={handleAddCart}
                                icon={<ShoppingCartOutlined />}
                                block
                            >
                                Thêm vào giỏ hàng
                            </Button>

                            <Button size="large" className="btn-contact" icon={<PhoneOutlined />} block>
                                Gọi tư vấn
                            </Button>
                        </div>
                    </div>

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

                    <Card
                        className="store-card"
                        size="small"
                        title={
                            <Space>
                                <EnvironmentOutlined />
                                <span>Hệ thống cửa hàng</span>
                            </Space>
                        }
                    >
                        <List
                            size="small"
                            dataSource={[
                                { address: "114 Hàm Nghi, Đà Nẵng", phone: "0898 143 789" },
                                { address: "484 Núi Thành, Đà Nẵng", phone: "0705 485 005" },
                                { address: "603 Tôn Đức Thắng, Đà Nẵng", phone: "0765 143 789" },
                            ]}
                            renderItem={(store) => (
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
