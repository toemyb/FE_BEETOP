import { React, useEffect, useState, useRef } from "react";
import { Badge, Button, Dropdown } from "antd";
import { ShoppingCartOutlined, UserOutlined, SearchOutlined, MenuOutlined } from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import { searchLaptops, getAllBrand, searchBrand } from "../../service/LapTopService";
import { getCartItems } from "../../service/CartCustomerService";

const BRAND_LOGOS = {
    "HP": "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg",
    "Dell": "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg",
    "MSI": "https://logos-world.net/wp-content/uploads/2020/11/MSI-Logo.png",
    "Asus": "https://upload.wikimedia.org/wikipedia/commons/b/b0/ASUS_Corporate_Logo.svg",
    "Lenovo": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg",
    "Macbook": "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    "Acer": "https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg",
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const isCustomer = localStorage.getItem("isCustomer") === "true";
    const customerData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const userName = customerData.ten || null;
    const [totalQuantity, setTotalQuantity] = useState(0);
    const debounceRef = useRef(null);
    const [hoveredBrand, setHoveredBrand] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);

    // --- BRAND DROPDOWN ---
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        getAllBrand().then(res => setBrands(res));
    }, []);

    // Lấy số lượng sản phẩm trong giỏ hàng
    useEffect(() => {
        const loadCartQuantity = async () => {
            if (isCustomer) {
                try {
                    const customerId = localStorage.getItem("isUser");
                    if (customerId) {
                        const cartItems = await getCartItems(customerId);
                        // Tính tổng số lượng sản phẩm (tổng số items, không phải tổng quantity)
                        const total = Array.isArray(cartItems) ? cartItems.length : (cartItems?.data?.length || 0);
                        setTotalQuantity(total);
                    }
                } catch (error) {
                    console.error("Lỗi khi lấy số lượng giỏ hàng:", error);
                    // Fallback về localStorage nếu API lỗi
                    const list = JSON.parse(localStorage.getItem("orderProduct") || "[]");
                    const total = list.reduce((sum, item) => sum + (item.quantity || 0), 0);
                    setTotalQuantity(total);
                }
            } else {
                // Nếu chưa đăng nhập, lấy từ localStorage
                const list = JSON.parse(localStorage.getItem("orderProduct") || "[]");
                const total = list.reduce((sum, item) => sum + (item.quantity || 0), 0);
                setTotalQuantity(total);
            }
        };
        
        loadCartQuantity();
    }, [location.pathname, isCustomer]);

    const handleSearch = async (value) => {
        try {
            if (value.trim() === "") {
                setSearchResults([]);
                return;
            }
            const results = await searchLaptops(value);
            setSearchResults(results);
        } catch (error) {
            console.error("Lỗi khi tìm kiếm laptop:", error);
        }
    };

    useEffect(() => {
        const delay = setTimeout(() => handleSearch(keyword), 500);
        return () => clearTimeout(delay);
    }, [keyword]);

    const menuItems = [
        { key: "1", label: <Link to="/profile" style={{textDecoration:'none'}}>Thông tin cá nhân</Link> },
        { key: "2", label: <Link to="/orders"  style={{textDecoration:'none'}}>Đơn hàng của bạn</Link> },
        {
            key: "3",
            danger: true,
            label: "Đăng xuất",
            onClick: () => {
                localStorage.removeItem("isCustomer");
                sessionStorage.removeItem("user");
                localStorage.removeItem("orderProduct");
                navigate("/login");
                window.location.reload();
            }
        },
    ];

    const handleHoverBrand = (brandId) => {
        setHoveredBrand(brandId);

        setLoading(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await searchBrand(brandId);
                setProducts(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }, 400); // debounce 400ms
    };

    return (
        <header className="header-wrapper">
            <div className="header-top">
                <img src="https://ttcenter.com.vn/images/header/1.svg" alt="" />
                <img src="https://ttcenter.com.vn/images/header/2.svg" alt="" />
                <img src="https://ttcenter.com.vn/images/header/3.svg" alt="" />
            </div>

            <div className="header-main">
                <Link to="/" className="header-logo">
                    <img src="https://ttcenter.com.vn/images/logo.svg" alt="Logo" />
                </Link>

                <div
                    className="category-container"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => {
                        setShowDropdown(false);
                        setHoveredBrand(null);
                        setProducts([]);
                    }}
                >
                    <div className="header-category">
                        <MenuOutlined />
                        <span>Danh mục</span>
                    </div>

                    {showDropdown && (
                        <div className="category-hover-zone">
                            <div className="dropdown-buffer"></div>
                            <div className="brand-dropdown">
                                {brands.map((b) => (
                                    <div
                                        key={b.id}
                                        className={`brand-item ${hoveredBrand === b.id ? "active" : ""}`}
                                        onMouseEnter={() => handleHoverBrand(b.id)}
                                    >
                                        <div className="brand-info">
                                            <img 
                                                src={BRAND_LOGOS[b.ten] || "https://via.placeholder.com/24"} 
                                                alt={b.ten} 
                                                className="brand-logo" 
                                                style={{height:"30px"  , objectFit:'contain'}}
                                            />
                                            <span className="brand-name">{b.ten}</span>
                                        </div>
                                        <span className={`brand-arrow ${hoveredBrand === b.id ? "active" : ""}`}>▶</span>
                                    </div>
                                ))}
                            </div>

                            {/* Panel sản phẩm */}
                            {hoveredBrand && (
                                <div className="brand-result-panel">
                                    {loading && (
                                        <div className="panel-loading">
                                            <div className="loading-spinner"></div>
                                            <span>Đang tải...</span>
                                        </div>
                                    )}

                                    {!loading && products.length > 0 && (
                                        <div className="product-list">
                                            {products.slice(0, 8).map((item) => (
                                                <div
                                                    key={item.chiTietID}
                                                    className="product-item"
                                                    onClick={() => {
                                                        navigate(`/product-detail/${item.laptopID}?ctId=${item.chiTietID}`);
                                                        setHoveredBrand(null);
                                                        setProducts([]);
                                                        setShowDropdown(false);
                                                    }}
                                                >
                                                    <div className="product-item-image">
                                                        <img 
                                                            src={item.anhDaiDien || item.image || "https://via.placeholder.com/80"} 
                                                            alt={item.tenSanPham}
                                                        />
                                                    </div>
                                                    <div className="product-item-info">
                                                        <div className="product-item-name">{item.tenSanPham}</div>
                                                        <div className="product-item-specs">
                                                            {item.cpu} • {item.ram} • {item.ssd}
                                                        </div>
                                                        <div className="product-item-price">
                                                            {item.giaBan?.toLocaleString()} ₫
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!loading && hoveredBrand && products.length === 0 && (
                                        <div className="panel-empty">
                                            <span>Không có sản phẩm</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ================== SEARCH ================== */}
                <div className="header-search">
                    <input
                        type="text"
                        placeholder="Bạn muốn tìm gì?"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                    <button><SearchOutlined /></button>

                    {searchResults.length > 0 && (
                        <div className="search-results-dropdown">
                            {searchResults.map((item, index) => (
                                <div
                                    key={index}
                                    className="search-item"
                                    onClick={() => {
                                        navigate(`/product-detail/${item.id}?ctId=${item.idSpct}`);
                                        setKeyword("");
                                        setSearchResults([]);
                                    }}
                                >
                                    <div className="search-item-name">{item.tenSanPham}</div>
                                    <div className="search-item-specs">
                                        {item.cpu} / {item.ram} / {item.ssd} / {item.gpu}
                                    </div>
                                    <div className="search-item-price">{item.giaBan?.toLocaleString()}₫</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ================== ACTIONS ================== */}
                <div className="header-actions">
                    <Link to="/tra-cuu" className="header-cart">
                        <SearchOutlined className="cart-icon" />
                        <span>Tra cứu</span>
                    </Link>

                    <Link to="/cart" className="header-cart">
                        <Badge count={totalQuantity} size="small" offset={[0, 4]}>
                            <ShoppingCartOutlined className="cart-icon" />
                        </Badge>
                        <span style={{ marginLeft: '7px' }}>Giỏ hàng</span>
                    </Link>

                    {!isCustomer ? (
                        <Link to="/login">
                            <Button className="header-login" icon={<UserOutlined />}>
                                Đăng nhập
                            </Button>
                        </Link>
                    ) : (
                        <Dropdown menu={{ items: menuItems }} trigger={["hover"]}  >
                            <div className="header-user">
                                <UserOutlined />
                                <span className="username">{userName}</span>
                            </div>
                        </Dropdown>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
