import React, { useMemo, useState } from "react";
import { Input, Button, Tag } from "antd";
import { 
  CheckCircleOutlined, 
  FileTextOutlined, 
  TruckOutlined,
  CreditCardOutlined,
  CarOutlined
} from "@ant-design/icons";
import "./OrderLookupPage.css";

// Có thể tái sử dụng dữ liệu mock giống OrderInformationPage
const MOCK_ORDERS = [
  {
    code: "DH20251201",
    phone: "0901234567",
    email: "nguyenvana@example.com",
    customerName: "Nguyễn Văn A",
    createdAt: "01/12/2025 10:30",
    status: "DELIVERED",
    subtotal: 18000000,
    discount: 1000000,
    shippingFee: 50000,
    total: 17000000,
    paymentMethod: "Thanh toán khi nhận hàng",
    shippingAddress: "123 Trần Duy Hưng, Cầu Giấy, Hà Nội",
    statusTimeline: [
      { step: "Chờ xác nhận", date: "16:37:35 23-12-2023", completed: true },
      { step: "Đã xác nhận", date: "16:39:23 23-12-2023", completed: true },
      { step: "Chờ vận chuyển", date: "16:39:47 23-12-2023", completed: true },
      { step: "Đã xác nhận", date: "16:40:10 23-12-2023", completed: true },
      { step: "Chờ vận chuyển", date: "16:40:15 23-12-2023", completed: true },
      { step: "Đang vận chuyển", date: "16:40:19 23-12-2023", completed: true },
      { step: "Đã thanh toán", date: "16:40:22 23-12-2023", completed: true },
    ],
    items: [
      {
        id: 1,
        name: "Laptop Dell XPS 15 9520",
        image: "https://via.placeholder.com/80x80?text=Laptop",
        price: 25000000,
        quantity: 1,
        specifications: "Intel Core i7, 16GB RAM, 512GB SSD"
      },
      {
        id: 2,
        name: "Chuột không dây Logitech MX Master 3",
        image: "https://via.placeholder.com/80x80?text=Mouse",
        price: 2500000,
        quantity: 2,
        specifications: "Bluetooth, Pin sạc"
      },
      {
        id: 3,
        name: "Bàn phím cơ Keychron K8",
        image: "https://via.placeholder.com/80x80?text=Keyboard",
        price: 3000000,
        quantity: 1,
        specifications: "Mechanical, RGB Backlight"
      }
    ]
  },
  {
    code: "DH20251120",
    phone: "0909999999",
    email: "nguyenvanb@example.com",
    customerName: "Nguyễn Văn B",
    createdAt: "20/11/2025 19:45",
    status: "SHIPPING",
    subtotal: 22000000,
    discount: 0,
    shippingFee: 90000,
    total: 22090000,
    paymentMethod: "Chuyển khoản",
    shippingAddress: "456 Lê Lợi, Q.1, TP. HCM",
    statusTimeline: [
      { step: "Chờ xác nhận", date: "16:37:35 23-12-2023", completed: true },
      { step: "Đã xác nhận", date: "16:39:23 23-12-2023", completed: true },
      { step: "Chờ vận chuyển", date: "16:39:47 23-12-2023", completed: true },
      { step: "Đã xác nhận", date: "16:40:10 23-12-2023", completed: true },
      { step: "Chờ vận chuyển", date: "16:40:15 23-12-2023", completed: true },
      { step: "Đang vận chuyển", date: "16:40:19 23-12-2023", completed: false },
      { step: "Đã thanh toán", date: "", completed: false },
    ],
    items: [
      {
        id: 4,
        name: "MacBook Pro 14 inch M2",
        image: "https://via.placeholder.com/80x80?text=MacBook",
        price: 45000000,
        quantity: 1,
        specifications: "Apple M2, 16GB RAM, 512GB SSD"
      },
      {
        id: 5,
        name: "Tai nghe AirPods Pro 2",
        image: "https://via.placeholder.com/80x80?text=AirPods",
        price: 6000000,
        quantity: 1,
        specifications: "Active Noise Cancellation"
      }
    ]
  },
];

const statusMap = {
  DELIVERED: { label: "Đã giao thành công", color: "green" },
  SHIPPING: { label: "Đang giao", color: "blue" },
  PREPARING: { label: "Đang chuẩn bị", color: "gold" },
  NEW: { label: "Mới đặt", color: "default" },
  CANCELLED: { label: "Đã hủy", color: "red" },
};

const OrderLookupPage = () => {
  const [keyword, setKeyword] = useState("");
  const [searched, setSearched] = useState(false);

  const result = useMemo(() => {
    if (!searched) return null;
    const k = keyword.trim().toLowerCase();
    if (!k) return null;

    return (
      MOCK_ORDERS.find(
        (o) =>
          o.code.toLowerCase() === k ||
          o.phone.replace(/\s/g, "") === k.replace(/\s/g, "") ||
          o.email.toLowerCase() === k
      ) || null
    );
  }, [keyword, searched]);

  const handleSearch = () => {
    setSearched(true);
  };

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
        return <CreditCardOutlined />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  const formatCurrency = (value) =>
    `${(value || 0).toLocaleString("vi-VN")} ₫`;

  return (
    <div className="lookup-page">
      <div className="lookup-card">
        <h1>Tra cứu đơn hàng</h1>
        <p>
          Nhập <strong>Mã đơn hàng</strong> hoặc <strong>Số điện thoại / Email</strong> để xem nhanh
          trạng thái đơn của bạn.
        </p>

        <div className="lookup-form">
          <Input
            size="large"
            placeholder="Ví dụ: DH20251201 hoặc 0901234567 hoặc email"
            value={keyword}
            onChange={(e) => {
              setKeyword(e.target.value);
              setSearched(false);
            }}
          />
          <Button
            size="large"
            type="primary"
            style={{ minWidth: 140 }}
            onClick={handleSearch}
          >
            Tra cứu
          </Button>
        </div>

        {!keyword && (
          <div className="lookup-helper">
            Gợi ý: bạn có thể xem toàn bộ lịch sử trong mục <strong>Đơn hàng của bạn</strong> khi đã
            đăng nhập.
          </div>
        )}

        {searched && keyword && !result && (
          <div className="lookup-empty">
            Không tìm thấy đơn hàng phù hợp. Vui lòng kiểm tra lại thông tin bạn đã nhập.
          </div>
        )}

        {result && result.statusTimeline && (
          <div className="lookup-result">
            {/* Thanh trạng thái timeline đẹp */}
            <div className="order-timeline-wrapper">
              <div className="order-timeline">
                {/* Đường nối với mũi tên */}
                <div className="timeline-connector">
                  {result.statusTimeline.map((_, index) => {
                    if (index === result.statusTimeline.length - 1) return null;
                    const isCompleted = result.statusTimeline[index].completed;
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
                  {result.statusTimeline.map((timelineItem, index) => {
                    const isCompleted = timelineItem.completed;
                    // Tìm bước hiện tại: bước đầu tiên chưa hoàn thành
                    const isCurrent = !isCompleted && (index === 0 || result.statusTimeline[index - 1].completed);
                    
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

            {/* Thông tin khách + tổng tiền */}
            <div className="lookup-info-block">
              <div className="lookup-info-left">
                <div className="lookup-row">
                  <span className="label">Mã đơn</span>
                  <span className="value code">{result.code}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Khách hàng</span>
                  <span className="value">{result.customerName}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">SĐT / Email</span>
                  <span className="value">
                    {result.phone} • {result.email}
                  </span>
                </div>
                <div className="lookup-row">
                  <span className="label">Giao đến</span>
                  <span className="value">{result.shippingAddress}</span>
                </div>
              </div>

              <div className="lookup-info-right">
                <div className="lookup-row">
                  <span className="label">Ngày đặt</span>
                  <span className="value">{result.createdAt}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Hình thức thanh toán</span>
                  <span className="value">{result.paymentMethod}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Trạng thái</span>
                  <span className="value">
                    <Tag color={statusMap[result.status].color}>
                      {statusMap[result.status].label}
                    </Tag>
                  </span>
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm đã mua */}
            {result.items && result.items.length > 0 && (
              <div className="lookup-products">
                <div className="products-title">Sản phẩm đã mua</div>
                <div className="products-list">
                  {result.items.map((item) => (
                    <div key={item.id} className="product-item">
                      <div className="product-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="product-info">
                        <div className="product-name">{item.name}</div>
                        {item.specifications && (
                          <div className="product-specs">{item.specifications}</div>
                        )}
                        <div className="product-quantity">Số lượng: {item.quantity}</div>
                      </div>
                      <div className="product-price">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tổng tiền chi tiết */}
            <div className="lookup-summary">
              <div className="summary-title">Tổng tiền đơn hàng</div>
              <div className="summary-row">
                <span className="summary-label">Tổng tiền hàng</span>
                <span className="summary-value">
                  {formatCurrency(result.subtotal ?? result.total)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Khuyến mãi</span>
                <span className="summary-value discount">
                  - {formatCurrency(result.discount || 0)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Phí vận chuyển</span>
                <span className="summary-value">
                  {formatCurrency(result.shippingFee || 0)}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span className="summary-label">Tổng thanh toán</span>
                <span className="summary-value total">
                  {formatCurrency(
                    (result.subtotal ?? result.total) - (result.discount || 0) + (result.shippingFee || 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderLookupPage;