import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Button, Modal } from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  TruckOutlined,
  CreditCardOutlined,
  CarOutlined,
  HomeOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  WalletOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined
} from "@ant-design/icons";
import axios from "axios";
import { getOrderProducts, cancelOrder } from "../../service/OrderService";
import "./OrderDetailPage.css";

const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
  const result = {
    provinceName: "",
    districtName: "",
    wardName: ""
  };

  try {
    if (provinceId) {
      try {
        const provinceIdNum = typeof provinceId === 'string' ? parseInt(provinceId) : provinceId;

        const resProvince = await axios.get(urlProvince, {
          headers: { token: tokenApiGHN }
        });

        let province = null;
        if (Array.isArray(resProvince.data.data)) {
          province = resProvince.data.data.find(p =>
            p.ProvinceID === provinceIdNum ||
            p.ProvinceID === provinceId ||
            String(p.ProvinceID) === String(provinceId)
          );
        } else if (resProvince.data.data && resProvince.data.data.ProvinceID) {
          const p = resProvince.data.data;
          if (p.ProvinceID === provinceIdNum || p.ProvinceID === provinceId || String(p.ProvinceID) === String(provinceId)) {
            province = p;
          }
        }

        if (province && province.ProvinceName) {
          result.provinceName = province.ProvinceName;
        }
      } catch (err) {
        console.error("Lỗi khi load tên tỉnh:", err);
      }
    }

    if (districtId) {
      try {
        const districtIdNum = typeof districtId === 'string' ? parseInt(districtId) : districtId;

        const params = provinceId ? { province_id: provinceId } : {};
        const resDistrict = await axios.get(urlDistricts, {
          params: params,
          headers: { token: tokenApiGHN }
        });

        let district = null;
        if (Array.isArray(resDistrict.data.data)) {
          district = resDistrict.data.data.find(d =>
            d.DistrictID === districtIdNum ||
            d.DistrictID === districtId ||
            String(d.DistrictID) === String(districtId)
          );
        } else if (resDistrict.data.data && resDistrict.data.data.DistrictID) {
          const d = resDistrict.data.data;
          if (d.DistrictID === districtIdNum || d.DistrictID === districtId || String(d.DistrictID) === String(districtId)) {
            district = d;
          }
        }

        if (district && district.DistrictName) {
          result.districtName = district.DistrictName;
        }
      } catch (err) {
        console.error("Lỗi khi load tên huyện:", err);
      }
    }

    if (wardCode && districtId) {
      try {
        const wardCodeNum = typeof wardCode === 'string' ? parseInt(wardCode) : wardCode;
        const wardCodeStr = String(wardCode);

        const resWard = await axios.get(urlWard, {
          params: { district_id: districtId },
          headers: { token: tokenApiGHN }
        });

        let ward = null;
        if (Array.isArray(resWard.data.data)) {
          ward = resWard.data.data.find(w => {
            const wCode = w.WardCode;
            return wCode === wardCodeNum ||
              wCode === wardCode ||
              Number(wCode) === Number(wardCodeNum) ||
              String(wCode) === wardCodeStr ||
              String(wCode) === String(wardCode);
          });
        } else if (resWard.data.data && resWard.data.data.WardCode) {
          const w = resWard.data.data;
          const wCode = w.WardCode;
          if (wCode === wardCodeNum ||
            wCode === wardCode ||
            Number(wCode) === Number(wardCodeNum) ||
            String(wCode) === wardCodeStr ||
            String(wCode) === String(wardCode)) {
            ward = w;
          }
        }

        if (ward && ward.WardName) {
          result.wardName = ward.WardName;
        }
      } catch (err) {
        console.error("Lỗi khi load tên xã:", err);
      }
    }
  } catch (error) {
    console.error("Lỗi khi load tên địa chỉ:", error);
  }

  return result;
};

const extractAddressIds = (addressString) => {
  if (!addressString) return { provinceId: null, districtId: null, wardCode: null };

  const addressParts = addressString.split(',').map(p => p.trim());

  let provinceId = null;
  let districtId = null;
  let wardCode = null;

  if (addressParts.length >= 4) {
    const wardPart = addressParts[1];
    const districtPart = addressParts[2];
    const provincePart = addressParts[3];

    if (wardPart && !isNaN(wardPart)) {
      wardCode = String(wardPart);
    }
    if (districtPart && !isNaN(districtPart)) {
      districtId = typeof districtPart === 'string' ? parseInt(districtPart) : districtPart;
    }
    if (provincePart && !isNaN(provincePart)) {
      provinceId = typeof provincePart === 'string' ? parseInt(provincePart) : provincePart;
    }
  }

  return { provinceId, districtId, wardCode };
};

// Hàm gộp sản phẩm trùng lại
const mergeDuplicateProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  // Sử dụng Map để gộp sản phẩm trùng
  const productMap = new Map();

  products.forEach((product) => {
    // Tạo key để xác định sản phẩm trùng
    // Ưu tiên dùng idLaptopChiTiet, nếu không có thì dùng tenSanPham + các thuộc tính khác
    const key = product.idLaptopChiTiet ||
      product.idLapTopChiTiet ||
      `${product.tenSanPham || ''}_${product.giaBan || ''}` ||
      product.idOrderCT;

    if (productMap.has(key)) {
      // Nếu đã có sản phẩm này, cộng số lượng và thành tiền
      const existingProduct = productMap.get(key);
      const newQuantity = (product.soLuong || 1);
      const existingQuantity = (existingProduct.soLuong || 1);
      existingProduct.soLuong = existingQuantity + newQuantity;
      existingProduct.thanhTien = (existingProduct.thanhTien || 0) + (product.thanhTien || 0);

      // Giữ lại idOrderCT đầu tiên hoặc tạo mảng nếu cần
      if (!Array.isArray(existingProduct.idOrderCT)) {
        existingProduct.idOrderCT = [existingProduct.idOrderCT];
      }
      if (product.idOrderCT) {
        existingProduct.idOrderCT.push(product.idOrderCT);
      }

      // Giữ lại idSeri nếu có
      if (product.idSeri) {
        if (!Array.isArray(existingProduct.idSeri)) {
          existingProduct.idSeri = existingProduct.idSeri ? [existingProduct.idSeri] : [];
        }
        existingProduct.idSeri.push(product.idSeri);
      }
    } else {
      // Nếu chưa có, thêm mới vào Map
      productMap.set(key, {
        ...product,
        soLuong: product.soLuong || 1,
        thanhTien: product.thanhTien || 0,
        idOrderCT: product.idOrderCT,
        idSeri: product.idSeri || null
      });
    }
  });

  // Chuyển Map thành mảng
  return Array.from(productMap.values());
};

const getStepIcon = (stepName) => {
  switch (stepName) {
    case "Chờ xác nhận":
      return <FileTextOutlined />;
    case "Đã xác nhận":
      return <CheckCircleOutlined />;
    case "Chờ vận chuyển":
      return <TruckOutlined />;
    case "Đang vận chuyển":
      return <CarOutlined />;
    case "Đã thanh toán":
      return <WalletOutlined />;
    case "Thành công":
      return <CheckCircleOutlined />;
    case "Đã hủy":
      return <CloseCircleOutlined />;
    default:
      return <CheckCircleOutlined />;
  }
};

const getStatusInfo = (trangThai) => {
  switch (trangThai) {
    case 1:
      return {
        label: "Chờ xác nhận",
        color: "#faad14",
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: false }
        ]
      };
    case 2:
      return {
        label: "Đã xác nhận",
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: false }
        ]
      };
    case 3:
      return {
        label: "Chờ vận chuyển",
        color: "#722ed1",
        bgColor: "#f9f0ff",
        borderColor: "#d3adf7",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Chờ vận chuyển", date: "", completed: false }
        ]
      };
    case 4:
      return {
        label: "Đang vận chuyển",
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Chờ vận chuyển", date: "", completed: true },
          { step: "Đang vận chuyển", date: "", completed: false }
        ]
      };
    case 5:
      return {
        label: "Đã thanh toán",
        color: "#13c2c2",
        bgColor: "#e6fffb",
        borderColor: "#87e8de",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Chờ vận chuyển", date: "", completed: true },
          { step: "Đang vận chuyển", date: "", completed: true },
          { step: "Đã thanh toán", date: "", completed: false }
        ]
      };
    case 6:
      return {
        label: "Thành công",
        color: "#52c41a",
        bgColor: "#f6ffed",
        borderColor: "#b7eb8f",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Chờ vận chuyển", date: "", completed: true },
          { step: "Đang vận chuyển", date: "", completed: true },
          { step: "Đã thanh toán", date: "", completed: true },
          { step: "Thành công", date: "", completed: true }
        ]
      };
    case 7:
      return {
        label: "Đã hủy",
        color: "#ff4d4f",
        bgColor: "#fff1f0",
        borderColor: "#ffccc7",
        timeline: [
          { step: "Đã hủy", date: "", completed: true }
        ]
      };
    default:
      return {
        label: "Chờ xác nhận",
        color: "#faad14",
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: false }
        ]
      };
  }
};

const OrderDetailPage = () => {
  const { idOrder } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [formattedAddress, setFormattedAddress] = useState("");

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const orderData = JSON.parse(sessionStorage.getItem('selectedOrder') || 'null');

        if (!orderData) {
          message.error('Không tìm thấy thông tin đơn hàng');
          navigate('/orders');
          return;
        }

        setOrderInfo(orderData);

        // Gọi API lấy danh sách sản phẩm
        const productsData = await getOrderProducts(idOrder);
        const rawProducts = Array.isArray(productsData) ? productsData : productsData?.data || [];

        // Gộp sản phẩm trùng lại
        const mergedProducts = mergeDuplicateProducts(rawProducts);
        setProducts(mergedProducts);
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        message.error('Không thể tải chi tiết đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    if (idOrder) {
      fetchOrderDetail();
    }
  }, [idOrder, navigate]);

  useEffect(() => {
    const loadAddress = async () => {
      if (orderInfo && orderInfo.customerAddress) {
        try {
          const { provinceId, districtId, wardCode } = extractAddressIds(orderInfo.customerAddress);

          let addressDisplay = orderInfo.customerAddress || "";
          if (provinceId || districtId || wardCode) {
            const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);

            const addressParts = [];

            let originalAddress = "";
            if (orderInfo.customerAddress) {
              const addressPartsArray = orderInfo.customerAddress.split(',').map(p => p.trim());
              if (addressPartsArray.length >= 4) {
                originalAddress = addressPartsArray[0];
              }
            }

            if (originalAddress) {
              addressParts.push(originalAddress);
            }
            if (addressNames.wardName) {
              addressParts.push(addressNames.wardName);
            }
            if (addressNames.districtName) {
              addressParts.push(addressNames.districtName);
            }
            if (addressNames.provinceName) {
              addressParts.push(addressNames.provinceName);
            }

            if (addressParts.length > 0) {
              addressDisplay = addressParts.join(", ") + ", Việt Nam";
            }
          }

          setFormattedAddress(addressDisplay);
        } catch (error) {
          console.error("Lỗi khi load tên địa chỉ:", error);
          setFormattedAddress(orderInfo.customerAddress);
        }
      } else {
        setFormattedAddress("");
      }
    };

    if (orderInfo) {
      loadAddress();
    }
  }, [orderInfo]);

  const formatPrice = (price) => {
    return `${(price || 0).toLocaleString("vi-VN")} ₫`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const year = date.getUTCFullYear();
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const cleanNote = (note) => {
    if (!note) return "";
    const index = note.indexOf("[DIA_CHI_DAY_DU");
    if (index !== -1) {
      const endIndex = note.indexOf("]", index);
      if (endIndex !== -1) {
        return note.substring(0, index).trim();
      }
      return note.substring(0, index).trim();
    }
    return note.trim();
  };

  const handleCancelOrder = () => {
    if (!orderInfo) return;

    Modal.confirm({
      title: 'Xác nhận hủy đơn hàng',
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn hủy đơn hàng ${orderInfo.maDonHang}?`,
      okText: 'Xác nhận',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const idTaiKhoan = localStorage.getItem("isUser");
          if (!idTaiKhoan) {
            message.error("Vui lòng đăng nhập để thực hiện thao tác này");
            return;
          }
          await cancelOrder(orderInfo.idOrder, idTaiKhoan);
          message.success("Hủy đơn hàng thành công");
          navigate('/orders');
        } catch (error) {
          console.error("Lỗi khi hủy đơn hàng:", error);
          message.error(error.response?.data?.message || "Không thể hủy đơn hàng");
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderInfo) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <p>Không tìm thấy thông tin đơn hàng</p>
        <Button onClick={() => navigate('/orders')}>Quay lại</Button>
      </div>
    );
  }

  const statusInfo = getStatusInfo(orderInfo.trangThai);
  const isCancelled = orderInfo.trangThai === 7;

  const subtotal = orderInfo.giaTriChuaGiam || 0;
  const discount = orderInfo.giaTriGiamGia || 0;
  const total = orderInfo.tongTienThuHo || 0;
  const shippingFee = Math.max(0, total - (subtotal - discount));

  const canCancelOrder = orderInfo.trangThai === 1 || orderInfo.trangThai === 2 || orderInfo.trangThai === 3;
  const isVNPAY = orderInfo.hinhThucThanhToan &&
    Array.isArray(orderInfo.hinhThucThanhToan) &&
    orderInfo.hinhThucThanhToan.some(method => method.includes("VNPAY"));

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/orders')}
          >
            Quay lại
          </Button>
          {canCancelOrder && (
            <Button
              danger={!isVNPAY}
              disabled={isVNPAY}
              icon={<CloseCircleOutlined />}
              onClick={() => !isVNPAY && handleCancelOrder()}
              style={{
                borderRadius: '8px',
                fontWeight: '500',
                height: '40px',
                paddingLeft: '20px',
                paddingRight: '20px'
              }}
            >
              {isVNPAY ? "Liên hệ cửa hàng" : "Hủy đơn"}
            </Button>
          )}
        </div>
        <h1>Chi tiết đơn hàng</h1>
        <p>Mã đơn hàng: <strong>{orderInfo.maDonHang}</strong></p>
      </div>

      <div className="order-detail-layout">
        {/* Cột trái: Timeline và Danh sách sản phẩm */}
        <div className="order-detail-left">
          {/* Timeline trạng thái */}
          <div className="order-detail-card">
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TruckOutlined style={{ color: '#1890ff' }} />
              Trạng thái đơn hàng
            </h2>

            {!isCancelled ? (
              <div className="order-timeline-wrapper">
                <div className="order-timeline">
                  {/* Đường nối với mũi tên */}
                  <div className="timeline-connector">
                    {statusInfo.timeline.map((_, index) => {
                      if (index === statusInfo.timeline.length - 1) return null;
                      const isCompleted = statusInfo.timeline[index].completed;
                      return (
                        <div
                          key={`connector-${index}`}
                          className={`timeline-connector-segment ${isCompleted ? 'completed' : ''}`}
                        >
                          <div className="timeline-arrow-head"></div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Các bước với icon */}
                  <div className="timeline-steps">
                    {statusInfo.timeline.map((timelineItem, index) => {
                      const isCompleted = timelineItem.completed;
                      const isCurrent = !isCompleted && (index === 0 || statusInfo.timeline[index - 1].completed);

                      return (
                        <div key={index} className="timeline-step">
                          {/* Icon tròn */}
                          <div className={`timeline-icon-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {getStepIcon(timelineItem.step)}
                          </div>

                          {/* Text trạng thái */}
                          <div className={`timeline-step-text ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                            {timelineItem.step}
                          </div>

                          {/* Timestamp */}
                          {timelineItem.date && (
                            <div className="timeline-step-date">
                              {timelineItem.date}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{
                padding: '20px',
                background: statusInfo.bgColor,
                border: `1px solid ${statusInfo.borderColor}`,
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <CheckCircleOutlined style={{ fontSize: '48px', color: statusInfo.color, marginBottom: '12px' }} />
                <div style={{ fontSize: '16px', fontWeight: '600', color: statusInfo.color }}>
                  {statusInfo.label}
                </div>
              </div>
            )}
          </div>

          {/* Danh sách sản phẩm */}
          <div className="order-detail-card">
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <TruckOutlined style={{ color: '#1890ff' }} />
              Sản phẩm đã mua ({products.length})
            </h2>

            {products.length > 0 ? (
              <div className="products-list">
                {products.map((item, index) => {
                  // Xử lý key cho trường hợp idOrderCT là mảng hoặc không
                  const itemKey = Array.isArray(item.idOrderCT)
                    ? item.idOrderCT[0]
                    : item.idOrderCT || index;

                  return (
                    <div key={itemKey} className="product-item">
                      <img
                        src={item.anhSanPham || "https://via.placeholder.com/120x120?text=Product"}
                        alt={item.tenSanPham}
                        className="product-image"
                      />
                      <div className="product-info">
                        <div className="product-name">{item.tenSanPham}</div>

                        <div className="product-quantity">Số lượng: {item.soLuong}</div>
                        <div className="product-price">
                          {formatPrice(item.thanhTien)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', color: '#8c8c8c' }}>
                Chưa có sản phẩm
              </div>
            )}
          </div>
        </div>

        {/* Cột phải: Tổng kết đơn hàng */}
        <div className="order-detail-right">
          <div className="order-detail-card">
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: '#262626',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CreditCardOutlined style={{ color: '#1890ff' }} />
              Tổng kết đơn hàng
            </h2>

            <div className="order-summary">
              <div className="summary-row">
                <span className="summary-label">Tổng tiền hàng:</span>
                <span className="summary-value">{formatPrice(subtotal)}</span>
              </div>

              {discount > 0 && (
                <div className="summary-row">
                  <span className="summary-label">Tổng tiền giảm:</span>
                  <span className="summary-value discount">-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="summary-row">
                <span className="summary-label">Phí vận chuyển:</span>
                <span className="summary-value">
                  {shippingFee === 0 ? (
                    <span style={{ color: '#52c41a', fontWeight: '600' }}>Miễn phí</span>
                  ) : (
                    formatPrice(shippingFee)
                  )}
                </span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span className="summary-label">Tổng thanh toán:</span>
                <span className="summary-value">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Thông tin khách hàng */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#262626',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <UserOutlined style={{ color: '#1890ff' }} />
                Thông tin khách hàng
              </h3>
              <div className="customer-info">
                <div className="info-row">
                  <span className="info-label">Họ và tên:</span>
                  <span className="info-value">{orderInfo.customerName}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{orderInfo.customerPhone}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Địa chỉ:</span>
                  <span className="info-value">
                    {formattedAddress || orderInfo.customerAddress || "Chưa cập nhật"}
                  </span>
                </div>
                {orderInfo.ghiChu && (
                  <div className="info-row">
                    <span className="info-label">Ghi chú:</span>
                    <span className="info-value">{cleanNote(orderInfo.ghiChu)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Thông tin đơn hàng */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#262626',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <FileTextOutlined style={{ color: '#1890ff' }} />
                Thông tin đơn hàng
              </h3>
              <div className="customer-info">
                <div className="info-row">
                  <span className="info-label">Mã đơn hàng:</span>
                  <span className="info-value" style={{ fontWeight: '700', color: '#1890ff' }}>
                    {orderInfo.maDonHang}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ngày đặt:</span>
                  <span className="info-value">{formatDate(orderInfo.ngayTao)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phương thức thanh toán:</span>
                  <span className="info-value">
                    {orderInfo.hinhThucThanhToan && orderInfo.hinhThucThanhToan.length > 0
                      ? orderInfo.hinhThucThanhToan.join(", ")
                      : "Chưa cập nhật"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

