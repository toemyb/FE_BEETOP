import React, { useMemo, useState } from "react";
import { Tag, Select, Empty } from "antd";
import { 
    CheckCircleOutlined, 
    TruckOutlined, 
    ClockCircleOutlined, 
    CloseCircleOutlined,
    WalletOutlined,
    CreditCardOutlined,
    ShoppingOutlined
} from "@ant-design/icons";

const { Option } = Select;

// TODO: Thay thế bằng API call thực tế
const MOCK_ORDERS = [
  {
    code: "DH20251201",
    createdAt: "01/12/2025 10:30",
    status: "DELIVERED",
    total: 18500000,
    paymentMethod: "Thanh toán khi nhận hàng",
  },
  {
    code: "DH20251120",
    createdAt: "20/11/2025 19:45",
    status: "SHIPPING",
    total: 22900000,
    paymentMethod: "VNPAY",
  },
  {
    code: "DH20251003",
    createdAt: "03/10/2025 14:12",
    status: "CANCELLED",
    total: 7900000,
    paymentMethod: "Thanh toán khi nhận hàng",
  },
];

const statusMap = {
  DELIVERED: { 
    label: "Hoàn tất", 
    color: "#52c41a",
    bgColor: "#f6ffed",
    borderColor: "#b7eb8f",
    icon: <CheckCircleOutlined />,
    steps: ["Chờ xác nhận", "Đang giao", "Hoàn tất"],
    currentStep: 3
  },
  SHIPPING: { 
    label: "Đang giao", 
    color: "#1890ff",
    bgColor: "#e6f7ff",
    borderColor: "#91d5ff",
    icon: <TruckOutlined />,
    steps: ["Chờ xác nhận", "Đang giao", "Hoàn tất"],
    currentStep: 2
  },
  PENDING: { 
    label: "Chờ xác nhận", 
    color: "#faad14",
    bgColor: "#fffbe6",
    borderColor: "#ffe58f",
    icon: <ClockCircleOutlined />,
    steps: ["Chờ xác nhận", "Đang giao", "Hoàn tất"],
    currentStep: 1
  },
  CANCELLED: { 
    label: "Đã hủy", 
    color: "#ff4d4f",
    bgColor: "#fff1f0",
    borderColor: "#ffccc7",
    icon: <CloseCircleOutlined />,
    steps: ["Đã hủy"],
    currentStep: 0
  },
};

const OrderHistory = () => {
  const [statusFilter, setStatusFilter] = useState("ALL");

  const orders = useMemo(() => {
    if (statusFilter === "ALL") return MOCK_ORDERS;
    return MOCK_ORDERS.filter((o) => o.status === statusFilter);
  }, [statusFilter]);

  const formatPrice = (price) => {
    return Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  return (
    <div className="order-history">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShoppingOutlined style={{ color: '#1890ff' }} />
          Thông tin đơn hàng
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#595959' }}>Lọc theo trạng thái:</span>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            size="large"
          >
            <Option value="ALL">Tất cả</Option>
            <Option value="PENDING">Chờ xác nhận</Option>
            <Option value="SHIPPING">Đang giao</Option>
            <Option value="DELIVERED">Hoàn tất</Option>
            <Option value="CANCELLED">Đã hủy</Option>
          </Select>
        </div>
      </div>

      {orders.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#fafafa',
          borderRadius: '12px'
        }}>
          <Empty description="Không có đơn hàng phù hợp" />
        </div>
      ) : (
        <div className="order-list">
          {orders.map((order) => {
            const status = statusMap[order.status];
            const isCancelled = order.status === "CANCELLED";
            
            return (
              <div 
                key={order.code} 
                className="order-card-item"
                style={{
                  border: `1px solid ${status.borderColor}`,
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '16px',
                  background: status.bgColor,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1.5fr', 
                  gap: '20px', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px', fontWeight: '500' }}>
                      Mã đơn
                    </div>
                    <div style={{ fontWeight: '600', color: '#262626', fontSize: '16px' }}>
                      {order.code}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px', fontWeight: '500' }}>
                      Ngày đặt
                    </div>
                    <div style={{ color: '#595959' }}>{order.createdAt}</div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px', fontWeight: '500' }}>
                      Thanh toán
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      color: '#595959'
                    }}>
                      {order.paymentMethod.includes("VNPAY") || order.paymentMethod.includes("Chuyển khoản") ? (
                        <WalletOutlined style={{ color: '#1890ff', fontSize: '16px' }} />
                      ) : (
                        <CreditCardOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                      )}
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '6px', fontWeight: '500' }}>
                      Tổng tiền
                    </div>
                    <div style={{ fontWeight: '600', color: '#f5222d', fontSize: '18px' }}>
                      {formatPrice(order.total)}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '12px', fontWeight: '500' }}>
                      Trạng thái
                    </div>
                    {!isCancelled ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {/* Progress Timeline */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', flexWrap: 'wrap' }}>
                          {status.steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isCompleted = stepNumber < status.currentStep;
                            const isCurrent = stepNumber === status.currentStep;
                            
                            return (
                              <React.Fragment key={step}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '80px' }}>
                                  <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: isCompleted || isCurrent ? status.color : '#d9d9d9',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    border: isCurrent ? `3px solid ${status.borderColor}` : 'none',
                                    boxShadow: isCurrent ? `0 0 0 2px ${status.bgColor}` : 'none',
                                    transition: 'all 0.3s'
                                  }}>
                                    {isCompleted ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : stepNumber}
                                  </div>
                                  <div style={{
                                    fontSize: '11px',
                                    color: isCompleted || isCurrent ? status.color : '#8c8c8c',
                                    fontWeight: isCurrent ? '600' : '400',
                                    textAlign: 'center',
                                    maxWidth: '80px',
                                    lineHeight: '1.3'
                                  }}>
                                    {step}
                                  </div>
                                </div>
                                {index < status.steps.length - 1 && (
                                  <div style={{
                                    width: '60px',
                                    height: '3px',
                                    background: isCompleted ? status.color : '#d9d9d9',
                                    marginTop: '16px',
                                    borderRadius: '2px',
                                    transition: 'all 0.3s'
                                  }}></div>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </div>
                        {/* Status Tag with Icon */}
                        <Tag 
                          icon={status.icon}
                          color={status.color}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            border: `2px solid ${status.borderColor}`,
                            background: status.bgColor,
                            margin: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          {status.label}
                        </Tag>
                      </div>
                    ) : (
                      <Tag 
                        icon={status.icon}
                        color={status.color}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          border: `2px solid ${status.borderColor}`,
                          background: status.bgColor,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        {status.label}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;

