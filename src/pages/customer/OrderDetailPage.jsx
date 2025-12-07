import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Button } from "antd";
import { 
    CheckCircleOutlined, 
    FileTextOutlined, 
    TruckOutlined,
    CreditCardOutlined,
    CarOutlined,
    HomeOutlined,
    ArrowLeftOutlined,
    UserOutlined,
    WalletOutlined
} from "@ant-design/icons";
import { getOrderProducts } from "../../service/OrderService";
import "./OrderDetailPage.css";

const getStepIcon = (stepName) => {
  switch(stepName) {
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
    default:
      return <CheckCircleOutlined />;
  }
};

// Map trạng thái từ số sang text và timeline
const getStatusInfo = (trangThai) => {
  // 1 = Chờ xác nhận, 2 = Đã xác nhận, 3 = Chờ vận chuyển, 4 = Đang vận chuyển, 5 = Đã thanh toán, 6 = Thành công
  switch(trangThai) {
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

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        // Lấy thông tin đơn hàng từ localStorage hoặc state (từ trang orders)
        const orderData = JSON.parse(sessionStorage.getItem('selectedOrder') || 'null');
        
        if (!orderData) {
          message.error('Không tìm thấy thông tin đơn hàng');
          navigate('/orders');
          return;
        }

        setOrderInfo(orderData);

        // Gọi API lấy danh sách sản phẩm
        const productsData = await getOrderProducts(idOrder);
        setProducts(Array.isArray(productsData) ? productsData : productsData?.data || []);
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

  const formatPrice = (price) => {
    return `${(price || 0).toLocaleString("vi-VN")} ₫`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
  const isCancelled = false; // Không có trạng thái hủy trong mapping mới

  // Tính phí vận chuyển từ dữ liệu API
  // tongTienThuHo = giaTriChuaGiam - giaTriGiamGia + phiVanChuyen
  const subtotal = orderInfo.giaTriChuaGiam || 0;
  const discount = orderInfo.giaTriGiamGia || 0;
  const total = orderInfo.tongTienThuHo || 0;
  // Tính phí vận chuyển: total = subtotal - discount + shippingFee
  const shippingFee = Math.max(0, total - (subtotal - discount));

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/orders')}
          style={{ marginBottom: '20px' }}
        >
          Quay lại
        </Button>
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
                {products.map((item) => (
                  <div key={item.idOrderCT} className="product-item">
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
                ))}
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
                  <span className="info-value">{orderInfo.tenKhachHang}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{orderInfo.sdtKhachHang}</span>
                </div>
                {orderInfo.ghiChu && (
                  <div className="info-row">
                    <span className="info-label">Ghi chú:</span>
                    <span className="info-value">{orderInfo.ghiChu}</span>
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

