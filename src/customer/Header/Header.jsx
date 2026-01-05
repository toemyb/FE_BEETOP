import React, { useEffect, useState, useRef } from "react";
import { Badge, Button, Dropdown } from "antd";
import {
  ShoppingCartOutlined,
  UserOutlined,
  SearchOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import {
  searchLaptops,
  getAllBrand,
  searchBrand,
  filterAvailableProducts,
} from "../../service/LapTopService";
import { getCartItems } from "../../service/CartCustomerService";
import logo from "../../img/BeeTop.png"
const BRAND_LOGOS = {
  HP: "https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg",
  Dell: "https://upload.wikimedia.org/wikipedia/commons/4/48/Dell_Logo.svg",
  MSI: "https://logos-world.net/wp-content/uploads/2020/11/MSI-Logo.png",
  Asus: "https://upload.wikimedia.org/wikipedia/commons/b/b0/ASUS_Corporate_Logo.svg",
  Lenovo: "https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg",
  Acer: "https://upload.wikimedia.org/wikipedia/commons/0/00/Acer_2011.svg",
  Apple: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
};

// ✅ tránh crash khi JSON sai
const safeParse = (raw, fallback) => {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isCustomer = localStorage.getItem("isCustomer") === "true";
  const customerData = safeParse(sessionStorage.getItem("user"), {});
  const userName = customerData?.ten || null;

  const [totalQuantity, setTotalQuantity] = useState(0);

  const debounceRef = useRef(null);
  const [hoveredBrand, setHoveredBrand] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const [brands, setBrands] = useState([]);

  useEffect(() => {
    getAllBrand().then((res) => setBrands(res || []));
  }, []);

  // ✅ helper: parse list items từ response CartResponse
  const extractCartItems = (response) => {
    if (!response) return [];

    // response là array
    if (Array.isArray(response)) return response;

    // response là CartResponse { sanPhams: [] }
    if (Array.isArray(response.sanPhams)) return response.sanPhams;

    // lỡ backend bọc thêm data
    if (response.data) {
      if (Array.isArray(response.data)) return response.data;
      if (Array.isArray(response.data.sanPhams)) return response.data.sanPhams;
    }

    return [];
  };

  // ✅ cộng soLuong đúng kể cả string "1"
  const calcTotalQuantity = (items) => {
    if (!Array.isArray(items) || items.length === 0) return 0;

    const hasQty = items.some(
      (x) => x?.soLuong !== undefined && x?.soLuong !== null
    );

    if (hasQty) {
      return items.reduce((sum, x) => sum + (Number(x?.soLuong) || 0), 0);
    }

    return items.length;
  };

  const loadCartQuantity = async () => {
    const customerId =
      sessionStorage.getItem("idTaiKhoan") || localStorage.getItem("customerId");

    // login khách hàng -> lấy từ BE
    if (isCustomer && customerId) {
      try {
        const response = await getCartItems(customerId);
        const items = extractCartItems(response);
        setTotalQuantity(calcTotalQuantity(items));
      } catch (error) {
        console.error("Lỗi khi lấy số lượng giỏ hàng:", error);

        // fallback localStorage
        const list = safeParse(localStorage.getItem("orderProduct"), []);
        setTotalQuantity(Array.isArray(list) ? list.length : 0);
      }
      return;
    }

    // chưa login -> localStorage
    const list = safeParse(localStorage.getItem("orderProduct"), []);
    setTotalQuantity(Array.isArray(list) ? list.length : 0);
  };

  useEffect(() => {
    loadCartQuantity();

    const handleCartUpdate = () => loadCartQuantity();
    window.addEventListener("cartUpdated", handleCartUpdate);

    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [location.pathname, isCustomer]);

  const handleSearch = async (value) => {
    try {
      if (!value || value.trim() === "") {
        setSearchResults([]);
        return;
      }
      const results = await searchLaptops(value);
      const availableResults = await filterAvailableProducts(results);
      setSearchResults(availableResults || []);
    } catch (error) {
      console.error("Lỗi khi tìm kiếm laptop:", error);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => handleSearch(keyword), 500);
    return () => clearTimeout(delay);
  }, [keyword]);

  const handleLogout = () => {
    localStorage.removeItem("isCustomer");
    localStorage.removeItem("orderProduct");
    localStorage.removeItem("customerId");
    localStorage.removeItem("isUser"); // dọn key cũ

    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("idTaiKhoan");

    navigate("/login");
    window.location.reload();
  };

  const menuItems = [
    {
      key: "1",
      label: (
        <Link to="/profile" style={{ textDecoration: "none" }}>
          Thông tin cá nhân
        </Link>
      ),
    },
    {
      key: "2",
      label: (
        <Link to="/orders" style={{ textDecoration: "none" }}>
          Đơn hàng của bạn
        </Link>
      ),
    },
    {
      key: "3",
      danger: true,
      label: "Đăng xuất",
      onClick: handleLogout,
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
        const availableProducts = await filterAvailableProducts(data);
        setProducts(availableProducts || []);
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  };

  // ✅ cleanup debounce khi unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <header className="header-wrapper">
      <div className="header-top">
        <img src="https://ttcenter.com.vn/images/header/2.svg" alt="" />
        <img src="https://ttcenter.com.vn/images/header/3.svg" alt="" />
      </div>

      <div className="header-main">
  <Link to="/" className="header-logo">
    <img src={logo} alt="Logo" />
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
            <span>Hãng</span>
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
                        style={{ height: "30px", objectFit: "contain" }}
                      />
                      <span className="brand-name">{b.ten}</span>
                    </div>
                    <span className={`brand-arrow ${hoveredBrand === b.id ? "active" : ""}`}>
                      ▶
                    </span>
                  </div>
                ))}
              </div>

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
                          key={item.chiTietID || item.idSpct || item.id}
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
                              src={
                                item.image ||
                                item.anhDaiDien ||
                                "https://1pro.vn/wp-content/uploads/2025/01/Pro-1422-M1-silver-600x500.png"
                              }
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

        {/* SEARCH */}
        <div className="header-search">
          <input
            type="text"
            placeholder="Bạn muốn tìm gì?"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button>
            <SearchOutlined />
          </button>

          {searchResults.length > 0 && (
            <div className="search-results-dropdown">
              {searchResults.map((item, index) => (
                <div
                  key={item.idSpct || item.id || index}
                  className="search-item"
                  onClick={() => {
                    navigate(`/product-detail/${item.id}?ctId=${item.idSpct}`);
                    setKeyword("");
                    setSearchResults([]);
                  }}
                >
                  <div className="search-item-image">
                    <img
                      src={
                        item.image ||
                        "https://1pro.vn/wp-content/uploads/2025/01/Pro-1422-M1-silver-600x500.png"
                      }
                      alt={item.tenSanPham}
                    />
                  </div>
                  <div className="search-item-content">
                    <div className="search-item-name">{item.tenSanPham}</div>
                    <div className="search-item-specs">
                      {item.cpu} / {item.ram} / {item.ssd} / {item.gpu}
                    </div>
                    <div className="search-item-price">
                      {item.giaBan?.toLocaleString()}₫
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ACTIONS */}
        <div className="header-actions">
          <Link to="/tra-cuu" className="header-cart">
            <SearchOutlined className="cart-icon" />
            <span>Tra cứu</span>
          </Link>

          <Link to="/cart" className="header-cart">
            <Badge
              count={totalQuantity > 0 ? totalQuantity : null}
              showZero={false}
              size="default"
              offset={[-8, -8]}
              style={{
                fontSize: "12px",
                fontWeight: "700",
                minWidth: "20px",
                height: "20px",
                lineHeight: "20px",
                boxShadow: "0 2px 8px rgba(255, 0, 0, 0.4)",
                left: "0px",
                right: "0px",
                marginTop: "0px",
              }}
            >
              <ShoppingCartOutlined className="cart-icon" />
            </Badge>
            <span style={{ marginLeft: "7px" }}>Giỏ hàng</span>
          </Link>

          {!isCustomer ? (
            <Link to="/login">
              <Button className="header-login" icon={<UserOutlined />}>
                Đăng nhập
              </Button>
            </Link>
          ) : (
            <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
              <div className="header-user" style={{ cursor: "pointer" }}>
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
