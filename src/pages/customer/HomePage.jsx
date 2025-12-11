import React, { useEffect, useState } from "react";
import { Carousel } from "antd";
import {
    FireOutlined,
    ThunderboltOutlined,
    DollarOutlined,
    SafetyOutlined,
    CustomerServiceOutlined,
    RocketOutlined,
    GiftOutlined,
    StarOutlined
} from "@ant-design/icons";
import ProductCard from "../../customer/ProductCard/ProductCard";
import "./HomePage.css";
import { CustomerLaptopList, CustomerLatestLaptopList, filterAvailableProducts } from "../../service/LapTopService";

const HomePage = () => {
    const [products, setProducts] = useState([]);
    const [latestProducts, setLatestProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingLatest, setLoadingLatest] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await CustomerLaptopList();
                const availableProducts = await filterAvailableProducts(data);
                setProducts(availableProducts);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        const loadLatest = async () => {
            try {
                const data = await CustomerLatestLaptopList();
                const availableProducts = await filterAvailableProducts(data);
                setLatestProducts(availableProducts);
            } catch (e) {
                console.error(e);
            } finally {
                setLoadingLatest(false);
            }
        };
        loadLatest();
    }, []);

    const categories = [
        { name: "Laptop Gaming", icon: "🎮", color: "#ff4d4f" },
        { name: "Văn phòng", icon: "💼", color: "#1890ff" },
        { name: "Đồ hoạ - Render", icon: "🎨", color: "#722ed1" },
        { name: "Sinh viên", icon: "🎓", color: "#52c41a" },
        { name: "Mỏng nhẹ", icon: "✨", color: "#fa8c16" },
        { name: "Workstation", icon: "🛠️", color: "#13c2c2" }
    ];

    const brands = [
        { name: "ASUS", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b0/ASUS_Corporate_Logo.svg" },
        { name: "Dell", logo: "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg" },
        { name: "HP", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg" },
        { name: "Lenovo", logo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg" },
        { name: "Acer", logo: "https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg" },
        { name: "MSI", logo: "https://logos-world.net/wp-content/uploads/2020/11/MSI-Logo.png" },
        { name: "Apple", logo: "https://logos-world.net/wp-content/uploads/2020/04/Apple-Logo.png" },
        { name: "Gigabyte", logo: "https://logos-world.net/wp-content/uploads/2020/11/Gigabyte-Logo.png" }
    ];

    const banners = [
        {
            image: "https://ttcenter.com.vn/uploads/gallery/back-to-school-2025-1753849908.webp",
            title: "Back To School 2025",
            subtitle: "Giảm đến 4 triệu – Quà tặng hấp dẫn",
            buttonText: "Mua ngay"
        },
        {
            image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1400",
            title: "Laptop Gaming Mới Nhất",
            subtitle: "Hiệu năng vượt trội cho game thủ",
            buttonText: "Khám phá"
        },
        {
            image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=1400",
            title: "Ưu đãi đặc biệt",
            subtitle: "Giảm giá lên đến 30% cho tất cả sản phẩm",
            buttonText: "Xem ngay"
        }
    ];

    // Chia sản phẩm thành các nhóm
    const featuredProducts = products.slice(0, 5);
    const saleProducts = products.slice(0, 8);

    return (
        <div className="home-new">
            {/* ======= BANNER CAROUSEL ======= */}
            <section className="banner-section">
                <Carousel autoplay effect="fade" className="banner-carousel">
                    {banners.map((banner, index) => (
                        <div key={index} className="banner-slide">
                            <div className="banner-image-wrapper">
                                <img src={banner.image} alt={banner.title} />
                                <div className="banner-overlay"></div>
                            </div>
                            <div className="banner-content">
                                <h1 className="banner-title">{banner.title}</h1>
                                <p className="banner-subtitle">{banner.subtitle}</p>
                                <button className="banner-button">{banner.buttonText}</button>
                            </div>
                        </div>
                    ))}
                </Carousel>
            </section>

            {/* ======= CATEGORY SECTION ======= */}
            <section className="category-section">
                <div className="section-container">
                    <h2 className="section-title">
                        <span className="title-icon">📱</span>
                        Danh mục sản phẩm
                    </h2>
                    <div className="category-grid">
                        {categories.map((c, i) => (
                            <div key={i} className="category-box" style={{ '--category-color': c.color }}>
                                <div className="cat-icon-wrapper">
                                    <span className="cat-icon">{c.icon}</span>
                                </div>
                                <div className="cat-name">{c.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ======= THƯƠNG HIỆU ======= */}
            <section className="brand-section">
                <div className="section-container">
                    <h2 className="section-title">
                        <span className="title-icon">🏆</span>
                        Thương hiệu nổi bật
                    </h2>
                    <div className="brand-grid">
                        {brands.map((brand, i) => (
                            <div key={i} className="brand-box">
                                <img src={brand.logo} alt={brand.name} />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ======= SẢN PHẨM NỔI BẬT ======= */}
            <section className="product-section">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">
                            <FireOutlined className="title-icon" />
                            Sản phẩm nổi bật
                        </h2>
                        <a href="/products" className="view-all-link">Xem tất cả →</a>
                    </div>
                    <div className="product-grid">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="product-skeleton">
                                    <div className="skeleton-img"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            ))
                        ) : (
                            featuredProducts.map((p) => (
                                <ProductCard key={p.laptopID} product={p} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ======= SẢN PHẨM MỚI ======= */}
            <section className="product-section product-section-alt">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">
                            <ThunderboltOutlined className="title-icon" />
                            Sản phẩm mới nhất
                        </h2>
                        <a href="#" className="view-all-link">Xem tất cả →</a>
                    </div>
                    <div className="product-grid">
                        {loadingLatest ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="product-skeleton">
                                    <div className="skeleton-img"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            ))
                        ) : (
                            latestProducts.map((p) => (
                                <ProductCard key={p.laptopID} product={p} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ======= SẢN PHẨM GIẢM GIÁ ======= */}
            <section className="product-section">
                <div className="section-container">
                    <div className="section-header">
                        <h2 className="section-title">
                            <GiftOutlined className="title-icon" />
                            Đang giảm giá
                        </h2>
                        <a href="#" className="view-all-link">Xem tất cả →</a>
                    </div>
                    <div className="product-grid">
                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="product-skeleton">
                                    <div className="skeleton-img"></div>
                                    <div className="skeleton-line"></div>
                                    <div className="skeleton-line short"></div>
                                </div>
                            ))
                        ) : (
                            saleProducts.map((p) => (
                                <ProductCard key={p.laptopID} product={p} />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* ======= LÝ DO CHỌN ======= */}
            <section className="info-section">
                <div className="section-container">
                    <h2 className="section-title">
                        <StarOutlined className="title-icon" />
                        Vì sao bạn nên chọn BeeLaptop
                    </h2>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-icon-wrapper">
                                <DollarOutlined className="info-icon" />
                            </div>
                            <h3>Giá luôn tốt nhất</h3>
                            <p>So sánh thị trường mỗi ngày, đảm bảo giá cạnh tranh nhất.</p>
                        </div>

                        <div className="info-item">
                            <div className="info-icon-wrapper">
                                <RocketOutlined className="info-icon" />
                            </div>
                            <h3>Giao hàng siêu tốc</h3>
                            <p>Nội thành giao trong 2 giờ – toàn quốc chỉ 24–48h.</p>
                        </div>

                        <div className="info-item">
                            <div className="info-icon-wrapper">
                                <SafetyOutlined className="info-icon" />
                            </div>
                            <h3>Bảo hành an tâm</h3>
                            <p>1 đổi 1 trong 30 ngày • Hỗ trợ kỹ thuật trọn đời.</p>
                        </div>

                        <div className="info-item">
                            <div className="info-icon-wrapper">
                                <CustomerServiceOutlined className="info-icon" />
                            </div>
                            <h3>Hỗ trợ 24/7</h3>
                            <p>Tư vấn tận tâm – luôn đồng hành cùng bạn.</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
