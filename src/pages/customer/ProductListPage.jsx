import React, { useState, useEffect } from "react";
import { Row, Col, Carousel, Skeleton, Select, Slider, Checkbox, Button, Empty } from "antd";
import { 
    FilterOutlined, 
    SortAscendingOutlined, 
    DollarOutlined,
    ThunderboltOutlined
} from "@ant-design/icons";
import ProductCard from "../../customer/ProductCard/ProductCard";
import { CustomerLaptopList, filterAvailableProducts } from "../../service/LapTopService";
import "./ProductListPage.css";

const { Option } = Select;

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    
    // Filter states
    const [priceRange, setPriceRange] = useState([0, 100000000]);
    const [selectedRam, setSelectedRam] = useState([]);
    const [selectedSsd, setSelectedSsd] = useState([]);
    const [selectedCpu, setSelectedCpu] = useState([]);
    const [sortBy, setSortBy] = useState("default");

    // Extract unique values for filters
    const rams = [...new Set(products.map(p => p.memory || p.ram).filter(Boolean))];
    const ssds = [...new Set(products.map(p => p.ssd).filter(Boolean))];
    const cpus = [...new Set(products.map(p => p.cpu).filter(Boolean))];

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await CustomerLaptopList();
                const availableProducts = await filterAvailableProducts(data);
                setProducts(availableProducts);
                setFilteredProducts(availableProducts);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách sản phẩm:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Apply filters
    useEffect(() => {
        let filtered = [...products];

        // Filter by price
        filtered = filtered.filter(p => {
            const price = p.price || 0;
            return price >= priceRange[0] && price <= priceRange[1];
        });

        // Filter by RAM
        if (selectedRam.length > 0) {
            filtered = filtered.filter(p => selectedRam.includes(p.memory || p.ram));
        }

        // Filter by SSD
        if (selectedSsd.length > 0) {
            filtered = filtered.filter(p => selectedSsd.includes(p.ssd));
        }

        // Filter by CPU
        if (selectedCpu.length > 0) {
            filtered = filtered.filter(p => selectedCpu.includes(p.cpu));
        }

        // Sort
        if (sortBy === "price-asc") {
            filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        } else if (sortBy === "price-desc") {
            filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        } else if (sortBy === "name-asc") {
            filtered.sort((a, b) => (a.productName || "").localeCompare(b.productName || ""));
        }

        setFilteredProducts(filtered);
    }, [products, priceRange, selectedRam, selectedSsd, selectedCpu, sortBy]);

    const handleResetFilters = () => {
        setPriceRange([0, 100000000]);
        setSelectedRam([]);
        setSelectedSsd([]);
        setSelectedCpu([]);
        setSortBy("default");
    };

    const maxPrice = Math.max(...products.map(p => p.price || 0), 100000000);

    return (
        <div className="product-list-page">
            {/* Banner Carousel */}
            <section className="banner-section">
                <Carousel autoplay effect="fade" className="product-banner">
                    <div className="banner-slide">
                        <img
                            src="https://ttcenter.com.vn/uploads/gallery/laptop-1758247902.jpg"
                            alt="Banner 1"
                        />
                    </div>
                    <div className="banner-slide">
                        <img
                            src="https://ttcenter.com.vn/uploads/gallery/thu-cu-doi-moi-len-doi-tro-gia-1753839696.webp"
                            alt="Banner 2"
                        />
                    </div>
                    <div className="banner-slide">
                        <img
                            src="https://ttcenter.com.vn/uploads/gallery/back-to-school-2025-1753849908.webp"
                            alt="Banner 3"
                        />
                    </div>
                </Carousel>
            </section>

            {/* Brand Bar */}
            <section className="brand-section">
                <div className="brand-container">
                    {[
                        "https://ttcenter.com.vn/uploads/product_menu/dell-1679907775.png",
                        "https://ttcenter.com.vn/uploads/product_menu/asus-1679907529.png",
                        "https://ttcenter.com.vn/uploads/product_menu/acer-1679907539.png",
                        "https://ttcenter.com.vn/uploads/product_menu/lenovo-1679907549.png",
                        "https://ttcenter.com.vn/uploads/product_menu/msi-1679907581.png",
                        "https://ttcenter.com.vn/uploads/product_menu/surface-1679907571.png",
                        "https://ttcenter.com.vn/uploads/product_menu/samsung-1679907591.png",
                        "https://ttcenter.com.vn/uploads/product_menu/gigabyte-1688183166.png",
                    ].map((logo, index) => (
                        <div key={index} className="brand-item">
                            <img src={logo} alt={`Brand ${index + 1}`} />
                        </div>
                    ))}
                </div>
            </section>

            {/* Main Content */}
            <div className="product-list-container">
                <div className="content-wrapper">
                    {/* Sidebar Filters */}
                    <aside className={`filter-sidebar ${showFilters ? "mobile-open" : ""}`}>
                        <div className="filter-header">
                            <FilterOutlined />
                            <span>Bộ lọc</span>
                            <Button 
                                type="link" 
                                size="small" 
                                onClick={handleResetFilters}
                                className="reset-btn"
                            >
                                Xóa bộ lọc
                            </Button>
                        </div>

                        {/* Price Filter */}
                        <div className="filter-group">
                            <div className="filter-title">
                                <DollarOutlined />
                                <span>Khoảng giá</span>
                            </div>
                            <div className="price-filter">
                                <Slider
                                    range
                                    min={0}
                                    max={maxPrice}
                                    value={priceRange}
                                    onChange={setPriceRange}
                                    step={1000000}
                                    tooltip={{
                                        formatter: (value) => `${(value / 1000000).toFixed(0)}M ₫`
                                    }}
                                />
                                <div className="price-range-display">
                                    <span>{Math.round(priceRange[0] / 1000000)}M ₫</span>
                                    <span> - </span>
                                    <span>{Math.round(priceRange[1] / 1000000)}M ₫</span>
                                </div>
                            </div>
                        </div>

                        {/* CPU Filter */}
                        {cpus.length > 0 && (
                            <div className="filter-group">
                                <div className="filter-title">
                                    <ThunderboltOutlined />
                                    <span>CPU</span>
                                </div>
                                <div className="checkbox-group">
                                    {cpus.slice(0, 10).map((cpu) => (
                                        <Checkbox
                                            key={cpu}
                                            checked={selectedCpu.includes(cpu)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedCpu([...selectedCpu, cpu]);
                                                } else {
                                                    setSelectedCpu(selectedCpu.filter(c => c !== cpu));
                                                }
                                            }}
                                        >
                                            {cpu}
                                        </Checkbox>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* RAM Filter */}
                        {rams.length > 0 && (
                            <div className="filter-group">
                                <div className="filter-title">
                                    <ThunderboltOutlined />
                                    <span>RAM</span>
                                </div>
                                <div className="checkbox-group">
                                    {rams.map((ram) => (
                                        <Checkbox
                                            key={ram}
                                            checked={selectedRam.includes(ram)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedRam([...selectedRam, ram]);
                                                } else {
                                                    setSelectedRam(selectedRam.filter(r => r !== ram));
                                                }
                                            }}
                                        >
                                            {ram}
                                        </Checkbox>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* SSD Filter */}
                        {ssds.length > 0 && (
                            <div className="filter-group">
                                <div className="filter-title">
                                    <ThunderboltOutlined />
                                    <span>SSD</span>
                                </div>
                                <div className="checkbox-group">
                                    {ssds.map((ssd) => (
                                        <Checkbox
                                            key={ssd}
                                            checked={selectedSsd.includes(ssd)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedSsd([...selectedSsd, ssd]);
                                                } else {
                                                    setSelectedSsd(selectedSsd.filter(s => s !== ssd));
                                                }
                                            }}
                                        >
                                            {ssd}
                                        </Checkbox>
                                    ))}
                                </div>
                            </div>
                        )}
                    </aside>

                    {/* Main Product Area */}
                    <main className="product-main">
                        {/* Toolbar */}
                        <div className="product-toolbar">
                            <div className="toolbar-left">
                                <Button
                                    className="filter-toggle"
                                    icon={<FilterOutlined />}
                                    onClick={() => setShowFilters(!showFilters)}
                                >
                                    Bộ lọc
                                </Button>
                                <span className="product-count">
                                    Tìm thấy <strong>{filteredProducts.length}</strong> sản phẩm
                                </span>
                            </div>
                            <div className="toolbar-right">
                                <span className="sort-label">
                                    <SortAscendingOutlined /> Sắp xếp:
                                </span>
                                <Select
                                    value={sortBy}
                                    onChange={setSortBy}
                                    className="sort-select"
                                    size="large"
                                >
                                    <Option value="default">Mặc định</Option>
                                    <Option value="price-asc">Giá: Thấp đến cao</Option>
                                    <Option value="price-desc">Giá: Cao đến thấp</Option>
                                    <Option value="name-asc">Tên: A-Z</Option>
                                </Select>
                            </div>
                        </div>

                        {/* Product Grid */}
                        {loading ? (
                            <div className="product-grid">
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className="product-skeleton">
                                        <Skeleton.Image active className="skeleton-image" />
                                        <Skeleton active paragraph={{ rows: 2 }} />
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="product-grid">
                                {filteredProducts.map((p) => (
                                    <ProductCard key={p.laptopID || p.id} product={p} />
                                ))}
                            </div>
                        ) : (
                            <Empty
                                description="Không tìm thấy sản phẩm nào"
                                className="empty-state"
                            >
                                <Button onClick={handleResetFilters}>Xóa bộ lọc</Button>
                            </Empty>
                        )}
                    </main>
                </div>
            </div>

            {/* Mobile Filter Overlay */}
            {showFilters && (
                <div 
                    className="filter-overlay"
                    onClick={() => setShowFilters(false)}
                ></div>
            )}
        </div>
    );
};

export default ProductListPage;
