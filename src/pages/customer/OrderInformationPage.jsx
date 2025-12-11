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
import axios from "axios";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getOrdersByCustomerId, cancelOrder } from "../../service/OrderService";
import CustomerInfoCard from "./components/CustomerInfoCard";
import "./OrderInformationPage.css";

const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

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

const mapStatusToKey = (trangThai) => {
    switch(trangThai) {
        case 1: return "PENDING";
        case 2: return "CONFIRMED";
        case 3: return "WAITING_SHIP";
        case 4: return "SHIPPING";
        case 5: return "PAID";
        case 6: return "SUCCESS";
        case 7: return "CANCELLED";
        case 0: return "CANCELLED";
        default: return "PENDING";
    }
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
                const wardCodeStr = String(wardCode);
                
                const resWard = await axios.get(urlWard, {
                    params: { district_id: districtId },
                    headers: { token: tokenApiGHN }
                });
                
                let ward = null;
                if (Array.isArray(resWard.data.data)) {
                    ward = resWard.data.data.find(w => 
                        String(w.WardCode) === wardCodeStr ||
                        w.WardCode === wardCode ||
                        String(w.WardCode) === String(wardCode)
                    );
                } else if (resWard.data.data && resWard.data.data.WardCode) {
                    const w = resWard.data.data;
                    if (String(w.WardCode) === wardCodeStr || w.WardCode === wardCode || String(w.WardCode) === String(wardCode)) {
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

const extractAddressIds = (order) => {
    let provinceId = order.provinceId || order.tinhThanhId || order.tinhThanh || null;
    let districtId = order.districtId || order.quanHuyenId || order.quanHuyen || null;
    let wardCode = order.wardCode || order.phuongXaCode || order.phuongXa || null;
    
    if ((!provinceId || !districtId || !wardCode) && order.diaChiDayDu) {
        const addressParts = order.diaChiDayDu.split(',').map(p => p.trim());
        
        if (addressParts.length >= 4) {
            const wardPart = addressParts[1];
            const districtPart = addressParts[2];
            const provincePart = addressParts[3];
            
            if (!wardCode && wardPart && !isNaN(wardPart)) {
                wardCode = String(wardPart);
            }
            if (!districtId && districtPart && !isNaN(districtPart)) {
                districtId = typeof districtPart === 'string' ? parseInt(districtPart) : districtPart;
            }
            if (!provinceId && provincePart && !isNaN(provincePart)) {
                provinceId = typeof provincePart === 'string' ? parseInt(provincePart) : provincePart;
            }
        }
    }
    
    if (provinceId && !isNaN(provinceId)) {
        provinceId = typeof provinceId === 'string' ? parseInt(provinceId) : provinceId;
    }
    if (districtId && !isNaN(districtId)) {
        districtId = typeof districtId === 'string' ? parseInt(districtId) : districtId;
    }
    if (wardCode && !isNaN(wardCode)) {
        wardCode = String(wardCode);
    }
    
    return { provinceId, districtId, wardCode };
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
                
                const mappedOrdersPromises = Array.isArray(ordersData) ? ordersData.map(async (order) => {
                    const { provinceId, districtId, wardCode } = extractAddressIds(order);
                    
                    let addressDisplay = order.diaChiDayDu || order.diaChi || "";
                    if (provinceId || districtId || wardCode) {
                        const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                        
                        const addressParts = [];
                        
                        let originalAddress = order.diaChiChiTiet || order.diaChi || "";
                        if (!originalAddress && order.diaChiDayDu) {
                            const addressPartsArray = order.diaChiDayDu.split(',').map(p => p.trim());
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
                    
                    return {
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
                        customerAddress: addressDisplay,
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
                    };
                }) : [];
                
                const mappedOrders = await Promise.all(mappedOrdersPromises);
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
        let result = statusFilter === "ALL" ? orders : orders.filter((o) => o.status === statusFilter);
        
        result = [...result].sort((a, b) => {
            const dateA = a.ngayTao ? new Date(a.ngayTao).getTime() : 0;
            const dateB = b.ngayTao ? new Date(b.ngayTao).getTime() : 0;
            return dateB - dateA;
        });
        
        return result;
    }, [orders, statusFilter]);

    const formatPrice = (price) => {
        return `${(price || 0).toLocaleString("vi-VN")} ₫`;
    };

    const handleViewDetail = (order) => {
        sessionStorage.setItem('selectedOrder', JSON.stringify(order));
        navigate(`/order-detail/${order.idOrder}`);
    };

    const handleCancelOrder = (order) => {
        Modal.confirm({
            title: 'Xác nhận hủy đơn hàng',
            icon: <ExclamationCircleOutlined />,
            content: `Bạn có chắc chắn muốn hủy đơn hàng ${order.code}?`,
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
                    await cancelOrder(order.idOrder, idTaiKhoan);
                    message.success("Hủy đơn hàng thành công");
                    const ordersData = await getOrdersByCustomerId(idTaiKhoan);
                    
                    const mappedOrdersPromises = Array.isArray(ordersData) ? ordersData.map(async (orderItem) => {
                        const { provinceId, districtId, wardCode } = extractAddressIds(orderItem);
                        
                        let addressDisplay = orderItem.diaChiDayDu || orderItem.diaChi || "";
                        if (provinceId || districtId || wardCode) {
                            const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                            
                            const addressParts = [];
                            
                            let originalAddress = orderItem.diaChiChiTiet || orderItem.diaChi || "";
                            if (!originalAddress && orderItem.diaChiDayDu) {
                                const addressPartsArray = orderItem.diaChiDayDu.split(',').map(p => p.trim());
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
                        
                        return {
                            idOrder: orderItem.idOrder,
                            code: orderItem.maDonHang,
                            createdAt: formatDate(orderItem.ngayTao),
                            status: mapStatusToKey(orderItem.trangThai),
                            total: orderItem.tongTienThuHo,
                            subtotal: orderItem.giaTriChuaGiam,
                            discount: orderItem.giaTriGiamGia,
                            shippingFee: 0,
                            paymentMethod: orderItem.hinhThucThanhToan && orderItem.hinhThucThanhToan.length > 0 
                                ? orderItem.hinhThucThanhToan.join(", ") 
                                : "Chưa cập nhật",
                            customerName: orderItem.tenKhachHang,
                            customerPhone: orderItem.sdtKhachHang,
                            customerAddress: addressDisplay,
                            note: orderItem.ghiChu || "",
                            trangThai: orderItem.trangThai,
                            maDonHang: orderItem.maDonHang,
                            ngayTao: orderItem.ngayTao,
                            hinhThucThanhToan: orderItem.hinhThucThanhToan,
                            tongTienThuHo: orderItem.tongTienThuHo,
                            giaTriChuaGiam: orderItem.giaTriChuaGiam,
                            giaTriGiamGia: orderItem.giaTriGiamGia,
                            loaiDon: orderItem.loaiDon,
                            ghiChu: orderItem.ghiChu || ""
                        };
                    }) : [];
                    
                    const mappedOrders = await Promise.all(mappedOrdersPromises);
                    setOrders(mappedOrders);
                } catch (error) {
                    console.error("Lỗi khi hủy đơn hàng:", error);
                    message.error(error.response?.data?.message || "Không thể hủy đơn hàng");
                }
            }
        });
    };

    return (
        <div className="order-page">
            <div className="order-page-header">
                <h1 style={{textAlign:'center' , marginBottom:'40px'}}>Lịch sử đơn hàng của bạn</h1>
                <p></p>
            </div>

            <div className="order-layout">
                <CustomerInfoCard orders={orders} />

                <section className="order-card order-list-card">
                    <div className="order-list-header">
                        <h2>Các đơn hàng của bạn</h2>
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

                                        <div style={{ 
                                            marginTop: '20px',
                                            paddingTop: '20px',
                                            borderTop: `1px solid ${status.borderColor}`,
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            gap: '12px'
                                        }}>
                                            {order.trangThai === 1 || order.trangThai === 2 || order.trangThai === 3 ? (
                                                (() => {
                                                    const isVNPAY = order.paymentMethod && order.paymentMethod.includes("VNPAY");
                                                    return (
                                                        <Button
                                                            danger={!isVNPAY}
                                                            disabled={isVNPAY}
                                                            icon={<CloseCircleOutlined />}
                                                            size="large"
                                                            onClick={() => !isVNPAY && handleCancelOrder(order)}
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
                                                    );
                                                })()
                                            ) : null}
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
