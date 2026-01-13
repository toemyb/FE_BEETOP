import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Spin, message, Button, Modal, Tooltip } from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  InboxOutlined,
  CreditCardOutlined,
  TruckOutlined,
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

const normalizeOrderStatus = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  const s = String(value).trim();
  if (s !== "" && !Number.isNaN(Number(s))) return Number(s);

  const upper = s.toUpperCase();
  const map = {
    DRAFT: 0,
    PENDING_CONFIRM: 1,
    PENDING_CONFIRMATION: 1,
    CONFIRMED: 2,
    PREPARING: 3,
    SHIPPING: 4,
    DELIVERED: 5,
    COMPLETED: 6,
    CANCELED: 7,
    CANCELLED: 7,
    "CHỜ XÁC NHẬN": 1,
    "ĐÃ XÁC NHẬN": 2,
    "ĐANG CHUẨN BỊ": 3,
    "ĐANG CHUẨN BỊ HÀNG": 3,
    "ĐANG GIAO": 4,
    "ĐANG GIAO HÀNG": 4,
    "ĐÃ GIAO": 5,
    "ĐÃ GIAO HÀNG": 5,
    "HOÀN THÀNH": 6,
    "THÀNH CÔNG": 6,
    "ĐÃ HỦY": 7
  };
  return map[upper] ?? 0;
};

const normalizePaymentStatus = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;

  const s = String(value).trim();
  if (s !== "" && !Number.isNaN(Number(s))) return Number(s);

  const upper = s.toUpperCase();
  if (upper === "PAID") return 1;
  if (upper === "UNPAID") return 0;
  return 0;
};

const getUserId = () => {
  const currentUser = JSON.parse(sessionStorage.getItem("user") || "null");
  return (
    localStorage.getItem("customerId") ||
    sessionStorage.getItem("idTaiKhoan") ||
    currentUser?.idTaiKhoan ||
    currentUser?.id ||
    currentUser?.userId ||
    currentUser?.data?.idTaiKhoan ||
    currentUser?.data?.id ||
    null
  );
};

const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
  const result = { provinceName: "", districtName: "", wardName: "" };

  try {
    if (provinceId) {
      try {
        const provinceIdNum = typeof provinceId === "string" ? parseInt(provinceId) : provinceId;
        const resProvince = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });

        let province = null;
        if (Array.isArray(resProvince.data.data)) {
          province = resProvince.data.data.find(
            (p) =>
              p.ProvinceID === provinceIdNum ||
              p.ProvinceID === provinceId ||
              String(p.ProvinceID) === String(provinceId)
          );
        }
        if (province?.ProvinceName) result.provinceName = province.ProvinceName;
      } catch (err) {
        console.error("Lỗi khi load tên tỉnh:", err);
      }
    }

    if (districtId) {
      try {
        const districtIdNum = typeof districtId === "string" ? parseInt(districtId) : districtId;
        const params = provinceId ? { province_id: provinceId } : {};
        const resDistrict = await axios.get(urlDistricts, { params, headers: { token: tokenApiGHN } });

        let district = null;
        if (Array.isArray(resDistrict.data.data)) {
          district = resDistrict.data.data.find(
            (d) =>
              d.DistrictID === districtIdNum ||
              d.DistrictID === districtId ||
              String(d.DistrictID) === String(districtId)
          );
        }
        if (district?.DistrictName) result.districtName = district.DistrictName;
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
          ward = resWard.data.data.find((w) => String(w.WardCode) === wardCodeStr);
        }
        if (ward?.WardName) result.wardName = ward.WardName;
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

  const addressParts = addressString.split(",").map((p) => p.trim());
  let provinceId = null;
  let districtId = null;
  let wardCode = null;

  if (addressParts.length >= 4) {
    const wardPart = addressParts[1];
    const districtPart = addressParts[2];
    const provincePart = addressParts[3];

    if (wardPart && !isNaN(wardPart)) wardCode = String(wardPart);
    if (districtPart && !isNaN(districtPart)) districtId = parseInt(districtPart);
    if (provincePart && !isNaN(provincePart)) provinceId = parseInt(provincePart);
  }

  return { provinceId, districtId, wardCode };
};

const mergeDuplicateProducts = (products) => {
  if (!Array.isArray(products) || products.length === 0) return [];

  const productMap = new Map();

  products.forEach((product) => {
    const key =
      product.idLaptopChiTiet ||
      product.idLapTopChiTiet ||
      `${product.tenSanPham || ""}_${product.giaBan || ""}` ||
      product.idOrderCT;

    if (productMap.has(key)) {
      const existing = productMap.get(key);
      const newQty = product.soLuong || 1;
      existing.soLuong = (existing.soLuong || 1) + newQty;
      existing.thanhTien = (existing.thanhTien || 0) + (product.thanhTien || 0);

      if (!Array.isArray(existing.idOrderCT)) existing.idOrderCT = [existing.idOrderCT];
      if (product.idOrderCT) existing.idOrderCT.push(product.idOrderCT);

      if (product.idSeri) {
        if (!Array.isArray(existing.idSeri)) existing.idSeri = existing.idSeri ? [existing.idSeri] : [];
        existing.idSeri.push(product.idSeri);
      }
    } else {
      productMap.set(key, {
        ...product,
        soLuong: product.soLuong || 1,
        thanhTien: product.thanhTien || 0,
        idOrderCT: product.idOrderCT,
        idSeri: product.idSeri || null
      });
    }
  });

  return Array.from(productMap.values());
};

const getStepIcon = (stepName) => {
  switch (stepName) {
    case "Chờ xác nhận":
      return <FileTextOutlined />;
    case "Đã xác nhận":
      return <CheckCircleOutlined />;
    case "Đang chuẩn bị hàng":
      return <InboxOutlined />;
    case "Đang giao hàng":
      return <TruckOutlined />;
    case "Đã giao hàng":
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
        timeline: [{ step: "Chờ xác nhận", date: "", completed: false }]
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
        label: "Đang chuẩn bị hàng",
        color: "#722ed1",
        bgColor: "#f9f0ff",
        borderColor: "#d3adf7",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Đang chuẩn bị hàng", date: "", completed: false }
        ]
      };
    case 4:
      return {
        label: "Đang giao hàng",
        color: "#1890ff",
        bgColor: "#e6f7ff",
        borderColor: "#91d5ff",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Đang chuẩn bị hàng", date: "", completed: true },
          { step: "Đang giao hàng", date: "", completed: false }
        ]
      };
    case 5:
      return {
        label: "Đã giao hàng",
        color: "#13c2c2",
        bgColor: "#e6fffb",
        borderColor: "#87e8de",
        timeline: [
          { step: "Chờ xác nhận", date: "", completed: true },
          { step: "Đã xác nhận", date: "", completed: true },
          { step: "Đang chuẩn bị hàng", date: "", completed: true },
          { step: "Đang giao hàng", date: "", completed: true },
          { step: "Đã giao hàng", date: "", completed: false }
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
          { step: "Đang chuẩn bị hàng", date: "", completed: true },
          { step: "Đang giao hàng", date: "", completed: true },
          { step: "Đã giao hàng", date: "", completed: true },
          { step: "Thành công", date: "", completed: true }
        ]
      };
    case 7:
      return {
        label: "Đã hủy",
        color: "#ff4d4f",
        bgColor: "#fff1f0",
        borderColor: "#ffccc7",
        timeline: [{ step: "Đã hủy", date: "", completed: true }]
      };
    default:
      return {
        label: "Chờ xác nhận",
        color: "#faad14",
        bgColor: "#fffbe6",
        borderColor: "#ffe58f",
        timeline: [{ step: "Chờ xác nhận", date: "", completed: false }]
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

  const getLaptopId = (item) => item?.idLaptop || item?.laptopID || item?.productId || null;
  const getCtId = (item) => item?.idLaptopCT || item?.idSpct || null;

  const goProductDetail = (item) => {
    const laptopId = getLaptopId(item);
    const ctId = getCtId(item);

    if (!laptopId) {
      message.warning("Không tìm thấy laptopId (ID sản phẩm cha) để xem chi tiết!");
      return;
    }
    navigate(`/product-detail/${laptopId}${ctId ? `?ctId=${ctId}` : ""}`);
  };

  useEffect(() => {
    const fetchOrderDetail = async () => {
      try {
        setLoading(true);
        const orderData = JSON.parse(sessionStorage.getItem("selectedOrder") || "null");

        if (!orderData) {
          message.error("Không tìm thấy thông tin đơn hàng");
          navigate("/orders");
          return;
        }

        setOrderInfo(orderData);

        const productsData = await getOrderProducts(idOrder);
        const rawProducts = Array.isArray(productsData) ? productsData : productsData?.data || [];
        setProducts(mergeDuplicateProducts(rawProducts));
      } catch (error) {
        console.error("Lỗi khi lấy chi tiết đơn hàng:", error);
        message.error("Không thể tải chi tiết đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    if (idOrder) fetchOrderDetail();
  }, [idOrder, navigate]);

  useEffect(() => {
    const loadAddress = async () => {
      if (orderInfo && orderInfo.customerAddress) {
        try {
          const { provinceId, districtId, wardCode } = extractAddressIds(orderInfo.customerAddress);

          let addressDisplay = orderInfo.customerAddress || "";
          if (provinceId || districtId || wardCode) {
            const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);

            const parts = [];
            let originalAddress = "";
            const arr = orderInfo.customerAddress.split(",").map((p) => p.trim());
            if (arr.length >= 4) originalAddress = arr[0];

            if (originalAddress) parts.push(originalAddress);
            if (addressNames.wardName) parts.push(addressNames.wardName);
            if (addressNames.districtName) parts.push(addressNames.districtName);
            if (addressNames.provinceName) parts.push(addressNames.provinceName);

            if (parts.length > 0) addressDisplay = parts.join(", ") + ", Việt Nam";
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

    if (orderInfo) loadAddress();
  }, [orderInfo]);

  const formatPrice = (price) => `${(price || 0).toLocaleString("vi-VN")} ₫`;

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
    const idx = note.indexOf("[DIA_CHI_DAY_DU");
    if (idx === -1) return note.trim();
    const end = note.indexOf("]", idx);
    return (end !== -1 ? note.substring(0, idx) : note.substring(0, idx)).trim();
  };

  const handleCancelOrder = () => {
    if (!orderInfo) return;

    Modal.confirm({
      title: "Xác nhận hủy đơn hàng",
      icon: <ExclamationCircleOutlined />,
      content: `Bạn có chắc chắn muốn hủy đơn hàng ${orderInfo.maDonHang}?`,
      okText: "Xác nhận",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          const idTaiKhoan = getUserId();
          if (!idTaiKhoan) {
            message.error("Vui lòng đăng nhập để thực hiện thao tác này");
            return;
          }

          const orderId = orderInfo?.idOrder || orderInfo?.id || idOrder;
          if (!orderId) {
            message.error("Không tìm thấy orderId để hủy đơn!");
            return;
          }

          await cancelOrder(orderId, idTaiKhoan);
          message.success("Hủy đơn hàng thành công");
          navigate("/orders");
        } catch (error) {
          console.error("Lỗi khi hủy đơn hàng:", error);
          message.error(error.response?.data?.message || "Không thể hủy đơn hàng");
        }
      }
    });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!orderInfo) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <p>Không tìm thấy thông tin đơn hàng</p>
        <Button onClick={() => navigate("/orders")}>Quay lại</Button>
      </div>
    );
  }

  const st = normalizeOrderStatus(
    orderInfo?.trangThai ?? orderInfo?.trangThaiDon ?? orderInfo?.orderStatus ?? orderInfo?.status ?? 0
  );

  const payStatus = normalizePaymentStatus(orderInfo?.trangThaiThanhToan ?? orderInfo?.paymentStatus ?? 0);

  const paidAmount = Number(orderInfo?.daThanhToan ?? orderInfo?.totalPaid ?? 0);

  const pmText = Array.isArray(orderInfo?.hinhThucThanhToan)
    ? orderInfo.hinhThucThanhToan.map((x) => (typeof x === "string" ? x : x?.tenHinhThuc || x?.name || "")).join(",")
    : String(orderInfo?.hinhThucThanhToan ?? "");

  const isVNPAY = pmText.toUpperCase().includes("VNPAY");

  // ✅ FIX: VNPay chỉ chặn khi đã PAID/đã có tiền
  const cancelMeta = (() => {
    if (st === 7) return { canCancel: false, label: "Hủy đơn", reason: "Đơn đã hủy." };
    if (st === 6) return { canCancel: false, label: "Hủy đơn", reason: "Đơn đã hoàn thành." };

    // Rule BE: chỉ hủy khi CHỜ XÁC NHẬN
    if (st !== 1) return { canCancel: false, label: "Hủy đơn", reason: "Đơn không còn ở trạng thái chờ xác nhận." };

    if (payStatus === 1 || paidAmount > 0) {
      return isVNPAY
        ? { canCancel: false, label: "Liên hệ cửa hàng", reason: "Đơn VNPay đã thanh toán, vui lòng liên hệ cửa hàng." }
        : { canCancel: false, label: "Hủy đơn", reason: "Đơn đã có thanh toán, không thể hủy." };
    }

    // VNPay nhưng chưa thanh toán -> vẫn cho hủy
    return { canCancel: true, label: "Hủy đơn", reason: "" };
  })();

  const statusInfo = getStatusInfo(st);
  const isCancelled = st === 7;

  const subtotal = orderInfo.giaTriChuaGiam || 0;
  const discount = orderInfo.giaTriGiamGia || 0;
  const total = orderInfo.tongTienThuHo || 0;
  const shippingFee = Math.max(0, total - (subtotal - discount));

  return (
    <div className="order-detail-page">
      <div className="order-detail-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate("/orders")}>
            Quay lại
          </Button>

          <Tooltip title={!cancelMeta.canCancel ? cancelMeta.reason : ""}>
            <span>
              <Button
                danger={cancelMeta.label === "Hủy đơn"}
                disabled={!cancelMeta.canCancel}
                icon={<CloseCircleOutlined />}
                onClick={() => cancelMeta.canCancel && handleCancelOrder()}
                style={{
                  borderRadius: "8px",
                  fontWeight: "500",
                  height: "40px",
                  paddingLeft: "20px",
                  paddingRight: "20px"
                }}
              >
                {cancelMeta.label}
              </Button>
            </span>
          </Tooltip>
        </div>

        <h1>Chi tiết đơn hàng</h1>
        <p>
          Mã đơn hàng: <strong>{orderInfo.maDonHang}</strong>
        </p>
      </div>

      <div className="order-detail-layout">
        <div className="order-detail-left">
          <div className="order-detail-card">
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#262626",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <InboxOutlined style={{ color: "#1890ff" }} />
              Trạng thái đơn hàng
            </h2>

            {!isCancelled ? (
              <div className="order-timeline-wrapper">
                <div className="order-timeline">
                  <div className="timeline-connector">
                    {statusInfo.timeline.map((_, index) => {
                      if (index === statusInfo.timeline.length - 1) return null;
                      const isCompleted = statusInfo.timeline[index].completed;
                      return (
                        <div
                          key={`connector-${index}`}
                          className={`timeline-connector-segment ${isCompleted ? "completed" : ""}`}
                        >
                          <div className="timeline-arrow-head"></div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="timeline-steps">
                    {statusInfo.timeline.map((timelineItem, index) => {
                      const isCompleted = timelineItem.completed;
                      const isCurrent = !isCompleted && (index === 0 || statusInfo.timeline[index - 1].completed);

                      return (
                        <div key={index} className="timeline-step">
                          <div className={`timeline-icon-circle ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                            {getStepIcon(timelineItem.step)}
                          </div>

                          <div className={`timeline-step-text ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}>
                            {timelineItem.step}
                          </div>

                          {timelineItem.date && <div className="timeline-step-date">{timelineItem.date}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: "20px",
                  background: statusInfo.bgColor,
                  border: `1px solid ${statusInfo.borderColor}`,
                  borderRadius: "12px",
                  textAlign: "center"
                }}
              >
                <CheckCircleOutlined style={{ fontSize: "48px", color: statusInfo.color, marginBottom: "12px" }} />
                <div style={{ fontSize: "16px", fontWeight: "600", color: statusInfo.color }}>{statusInfo.label}</div>
              </div>
            )}
          </div>

          <div className="order-detail-card">
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#262626",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <InboxOutlined style={{ color: "#1890ff" }} />
              Sản phẩm đã mua ({products.length})
            </h2>

            {products.length > 0 ? (
              <div className="products-list">
                {products.map((item, index) => {
                  const itemKey = Array.isArray(item.idOrderCT) ? item.idOrderCT[0] : item.idOrderCT || index;

                  return (
                    <div
                      key={itemKey}
                      className="product-item"
                      onClick={() => goProductDetail(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <img
                        src={item.anhSanPham || "https://via.placeholder.com/120x120?text=Product"}
                        alt={item.tenSanPham}
                        className="product-image"
                      />
                      <div className="product-info">
                        <div className="product-name">{item.tenSanPham}</div>
                        <div className="product-quantity">Số lượng: {item.soLuong}</div>
                        <div className="product-price">{formatPrice(item.thanhTien)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#8c8c8c" }}>Chưa có sản phẩm</div>
            )}
          </div>
        </div>

        <div className="order-detail-right">
          <div className="order-detail-card">
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "20px",
                color: "#262626",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <CreditCardOutlined style={{ color: "#1890ff" }} />
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
                    <span style={{ color: "#52c41a", fontWeight: "600" }}>Miễn phí</span>
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

            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "#262626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <UserOutlined style={{ color: "#1890ff" }} />
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
                  <span className="info-value">{formattedAddress || orderInfo.customerAddress || "Chưa cập nhật"}</span>
                </div>

                {orderInfo.ghiChu && (
                  <div className="info-row">
                    <span className="info-label">Ghi chú:</span>
                    <span className="info-value">{cleanNote(orderInfo.ghiChu)}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid #e5e7eb" }}>
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: "600",
                  marginBottom: "16px",
                  color: "#262626",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <FileTextOutlined style={{ color: "#1890ff" }} />
                Thông tin đơn hàng
              </h3>

              <div className="customer-info">
                <div className="info-row">
                  <span className="info-label">Mã đơn hàng:</span>
                  <span className="info-value" style={{ fontWeight: "700", color: "#1890ff" }}>
                    {orderInfo.maDonHang}
                  </span>
                </div>

                <div className="info-row">
                  <span className="info-label">Ngày đặt:</span>
                  <span className="info-value">{formatDate(orderInfo.ngayTao)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">Loại đơn:</span>
                  <span className="info-value">
                    {(() => {
                      const t = String(orderInfo.loaiDon || orderInfo.orderType || "").toUpperCase();
                      if (t.includes("ONLINE")) return "Đơn hàng online";
                      if (t.includes("GIAO_HANG") || t.includes("GIAO HANG") || t.includes("DELIVERY")) return "Bán giao hàng";
                      if (t.includes("TAI_QUAY") || t.includes("POS") || t.includes("QUAY")) return "Bán tại quầy";
                      return orderInfo.loaiDon || "Chưa cập nhật";
                    })()}
                  </span>
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
