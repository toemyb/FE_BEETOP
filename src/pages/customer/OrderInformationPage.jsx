import React, { useMemo, useState, useEffect } from "react";
import { Tag, Select, Spin, message, Button } from "antd";
import { 
    CheckCircleOutlined, 
    TruckOutlined, 
    ClockCircleOutlined, 
    CloseCircleOutlined,
    WalletOutlined,
    CreditCardOutlined,
    FileTextOutlined,
    DollarOutlined,
    CarOutlined,
    HomeOutlined,
    EyeOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { getOrdersByCustomerId } from "../../service/OrderService";
import CustomerInfoCard from "./components/CustomerInfoCard";
import "./OrderInformationPage.css";

const { Option } = Select;

const statusMap = {
    PENDING: { 
        label: "Chờ xác nhận", 
        color: "#faad14",
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
    },
    CONFIRMED: { 
        label: "Đã xác nhận", 
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
    },
    WAITING_SHIP: { 
        label: "Chờ vận chuyển", 
        color: "#722ed1",
        bgColor: "#f9f0ff",
        borderColor: "#d3adf7",
    },
    SHIPPING: { 
        label: "Đang vận chuyển", 
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
    },
    PAID: { 
        label: "Đã thanh toán", 
        color: "#13c2c2",
        bgColor: "#e6fffb",
        borderColor: "#87e8de",
    },
    SUCCESS: { 
        label: "Thành công", 
        color: "#52c41a",
        bgColor: "#f6ffed",
        borderColor: "#b7eb8f",
    },
    CANCELLED: { 
        label: "Đã hủy", 
        color: "#ff4d4f",
        bgColor: "#fff1f0",
        borderColor: "#ffccc7",
    },
};

// Map status từ backend (1-6) sang key
const mapStatusToKey = (trangThai) => {
    switch(trangThai) {
        case 1: return "PENDING";
        case 2: return "CONFIRMED";
        case 3: return "WAITING_SHIP";
        case 4: return "SHIPPING";
        case 5: return "PAID";
        case 6: return "SUCCESS";
        case 0: return "CANCELLED";
        default: return "PENDING";
    }
};

const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const OrderInformationPage = () => {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const customerId = localStorage.getItem("isUser");
                if (!customerId) {
                    message.error("Vui lòng đăng nhập để xem đơn hàng");
                    return;
                }
                const ordersData = await getOrdersByCustomerId(customerId);
                const mappedOrders = Array.isArray(ordersData) ? ordersData.map(order => ({
                    idOrder: order.idOrder,
                    code: order.maDonHang,
                    createdAt: formatDate(order.ngayTao),
                    status: mapStatusToKey(order.trangThai),
                    total: order.tongTienThuHo,
                    subtotal: order.giaTriChuaGiam,
                    discount: order.giaTriGiamGia,
                    shippingFee: 0,
                    paymentMethod: order.hinhThucThanhToan && order.hinhThucThanhToan.length > 0 
                        ? order.hinhThucThanhToan.join(", ") 
                        : "Chưa cập nhật",
                    customerName: order.tenKhachHang,
                    customerPhone: order.sdtKhachHang,
                    note: order.ghiChu || "",
                    trangThai: order.trangThai,
                    maDonHang: order.maDonHang,
                    ngayTao: order.ngayTao,
                    hinhThucThanhToan: order.hinhThucThanhToan,
                    tongTienThuHo: order.tongTienThuHo,
                    giaTriChuaGiam: order.giaTriChuaGiam,
                    giaTriGiamGia: order.giaTriGiamGia,
                    loaiDon: order.loaiDon,
                    ghiChu: order.ghiChu || ""
                })) : [];
                setOrders(mappedOrders);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách đơn hàng:", error);
                message.error("Không thể tải danh sách đơn hàng");
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        if (statusFilter === "ALL") return orders;
        return orders.filter((o) => o.status === statusFilter);
    }, [orders, statusFilter]);

    const formatPrice = (price) => {
        return `${(price || 0).toLocaleString("vi-VN")} ₫`;
    };

    const handleViewDetail = (order) => {
        sessionStorage.setItem('selectedOrder', JSON.stringify(order));
        navigate(`/order-detail/${order.idOrder}`);
    };

    return (
        <div className="order-page">
            <div className="order-page-header">
                <h1>Lịch sử đơn hàng của bạn</h1>
                <p>Theo dõi tình trạng đơn hàng và thông tin mua hàng một cách nhanh chóng.</p>
            </div>

            <div className="order-layout">
                {/* -------- THÔNG TIN KHÁCH HÀNG -------- */}
                <CustomerInfoCard orders={orders} />

                {/* -------- LỊCH SỬ ĐƠN HÀNG -------- */}
                <section className="order-card order-list-card">
                    <div className="order-list-header">
                        <h2>Đơn hàng gần đây</h2>
                        <div className="order-filters">
                            <span>Lọc theo trạng thái:</span>
                            <Select
                                size="small"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                style={{ width: 180 }}
                            >
                                <Option value="ALL">Tất cả</Option>
                                <Option value="PENDING">Chờ xác nhận</Option>
                                <Option value="CONFIRMED">Đã xác nhận</Option>
                                <Option value="WAITING_SHIP">Chờ vận chuyển</Option>
                                <Option value="SHIPPING">Đang vận chuyển</Option>
                                <Option value="PAID">Đã thanh toán</Option>
                                <Option value="SUCCESS">Thành công</Option>
                                <Option value="CANCELLED">Đã hủy</Option>
                            </Select>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                            <Spin size="large" />
                        </div>
                    ) : (
                        <div className="order-table">
                            {filteredOrders.map((order) => {
                                const status = statusMap[order.status] || statusMap["PENDING"];
                                const isCancelled = order.status === "CANCELLED";
                                
                                return (
                                    <div key={order.code} className="order-card-item" style={{
                                        border: `1px solid ${status.borderColor}`,
                                        borderRadius: '16px',
                                        padding: '24px',
                                        marginBottom: '20px',
                                        background: status.bgColor,
                                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.12)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.08)';
                                    }}
                                    >
                                        {/* Header với thông tin đơn hàng */}
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                                            gap: '20px', 
                                            alignItems: 'flex-start',
                                            marginBottom: '20px',
                                            paddingBottom: '20px',
                                            borderBottom: `1px solid ${status.borderColor}`
                                        }}>
                                            <div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#8c8c8c', 
                                                    marginBottom: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>Mã đơn</div>
                                                <div className="order-code" style={{ 
                                                    fontWeight: '700', 
                                                    color: '#262626',
                                                    fontSize: '16px',
                                                    letterSpacing: '0.5px'
                                                }}>{order.code}</div>
                                            </div>
                                            <div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#8c8c8c', 
                                                    marginBottom: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>Ngày đặt</div>
                                                <div style={{ 
                                                    color: '#595959',
                                                    fontSize: '14px',
                                                    fontWeight: '500'
                                                }}>{order.createdAt}</div>
                                            </div>
                                            <div>
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#8c8c8c', 
                                                    marginBottom: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>Thanh toán</div>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: '8px',
                                                    color: '#595959',
                                                    fontSize: '14px',
                                                    fontWeight: '500'
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
                                                <div style={{ 
                                                    fontSize: '11px', 
                                                    color: '#8c8c8c', 
                                                    marginBottom: '6px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px',
                                                    fontWeight: '600'
                                                }}>Tổng tiền</div>
                                                <div className="order-total" style={{ 
                                                    fontWeight: '700', 
                                                    color: '#f5222d', 
                                                    fontSize: '18px'
                                                }}>
                                                    {formatPrice(order.total)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Nút Chi tiết */}
                                        <div style={{ 
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            borderTop: `1px solid ${status.borderColor}`,
                                            display: 'flex',
                                            justifyContent: 'flex-end'
                                        }}>
                                            <Button
                                                type="primary"
                                                icon={<EyeOutlined />}
                                                size="large"
                                                onClick={() => handleViewDetail(order)}
                                                style={{
                                                    borderRadius: '8px',
                                                    fontWeight: '500',
                                                    boxShadow: '0 2px 8px rgba(24, 144, 255, 0.2)',
                                                    height: '40px',
                                                    paddingLeft: '20px',
                                                    paddingRight: '20px'
                                                }}
                                            >
                                                Chi tiết
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredOrders.length === 0 && !loading && (
                                <div className="order-empty">Không có đơn hàng phù hợp.</div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default OrderInformationPage;
