import React, { useState } from "react";
import { Input, Button, Tag, Spin, message } from "antd";
import {
  CheckCircleOutlined,
  FileTextOutlined,
  TruckOutlined,
  CreditCardOutlined,
  CarOutlined,
  WalletOutlined
} from "@ant-design/icons";
import axios from "axios";
import { searchOrder } from "../../service/OrderService";
import "./OrderLookupPage.css";

const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

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
    default:
      return {
        label: "Không xác định",
        color: "#8c8c8c",
        bgColor: "#fafafa",
        borderColor: "#d9d9d9",
        timeline: []
      };
  }
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

const extractAddressIds = (diaChiGiaoHang) => {
  if (!diaChiGiaoHang) return { provinceId: null, districtId: null, wardCode: null };

  const addressParts = diaChiGiaoHang.split(',').map(p => p.trim());

  let provinceId = null;
  let districtId = null;
  let wardCode = null;

  if (addressParts.length >= 4) {
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

const OrderLookupPage = () => {
  const [maDonHang, setMaDonHang] = useState("");
  const [sdt, setSdt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const [formattedAddress, setFormattedAddress] = useState("");

  const handleSearch = async () => {
    if (!maDonHang.trim() && !sdt.trim()) {
      message.warning("Vui lòng nhập mã đơn hàng hoặc số điện thoại");
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      setFormattedAddress("");
      const data = await searchOrder(maDonHang.trim(), sdt.trim());

      if (data && Array.isArray(data) && data.length > 0) {
        const orderData = data[0];
        setResult(orderData);

        setLoading(false);

        if (orderData.diaChiGiaoHang) {
          (async () => {
            try {
              const { provinceId, districtId, wardCode } = extractAddressIds(orderData.diaChiGiaoHang);

              let addressDisplay = orderData.diaChiGiaoHang || "";
              if (provinceId || districtId || wardCode) {
                const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);

                const addressParts = [];

                let originalAddress = "";
                if (orderData.diaChiGiaoHang) {
                  const addressPartsArray = orderData.diaChiGiaoHang.split(',').map(p => p.trim());
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
                  setFormattedAddress(addressDisplay);
                } else {
                  setFormattedAddress(orderData.diaChiGiaoHang);
                }
              } else {
                setFormattedAddress(orderData.diaChiGiaoHang);
              }
            } catch (error) {
              console.error("Lỗi khi load tên địa chỉ:", error);
              setFormattedAddress(orderData.diaChiGiaoHang);
            }
          })();
        } else {
          setFormattedAddress("");
        }
      } else {
        setResult(null);
        setFormattedAddress("");
        setLoading(false);
        message.info("Không tìm thấy đơn hàng phù hợp");
      }
    } catch (error) {
      console.error("Lỗi khi tìm kiếm đơn hàng:", error);
      setResult(null);
      setFormattedAddress("");
      setLoading(false);
      if (error.response && error.response.status === 404) {
        message.info("Không tìm thấy đơn hàng phù hợp");
      } else {
        message.error("Có lỗi xảy ra khi tìm kiếm đơn hàng");
      }
    }
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
      default:
        return <CheckCircleOutlined />;
    }
  };

  const formatCurrency = (value) =>
    `${(value || 0).toLocaleString("vi-VN")} ₫`;

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

  const statusInfo = result ? getStatusInfo(result.trangThai) : null;

  return (
    <div className="lookup-page">
      <div className="lookup-card">
        <h1 style={{ textAlign: 'center' }}>Tra cứu đơn hàng</h1>
        <p style={{ textAlign: 'center', marginBottom: '40px' }}>
          Nhập <strong>Mã đơn hàng</strong> và <strong>Số điện thoại</strong> để xem nhanh
          trạng thái đơn của bạn.
        </p>

        <div className="lookup-form">
          <Input
            size="large"
            placeholder="Mã đơn hàng (VĐ: OD123456)"
            value={maDonHang}
            onChange={(e) => {
              setMaDonHang(e.target.value);
              setSearched(false);
              setResult(null);
            }}
            onPressEnter={handleSearch}
          />
          <Input
            size="large"
            placeholder="Số điện thoại (ví dụ: 0945678901)"
            value={sdt}
            onChange={(e) => {
              setSdt(e.target.value);
              setSearched(false);
              setResult(null);
            }}
            onPressEnter={handleSearch}
          />
          <Button
            size="large"
            type="primary"
            style={{ minWidth: 140 }}
            onClick={handleSearch}
            loading={loading}
          >
            Tra cứu
          </Button>
        </div>



        {loading && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        )}

        {searched && !loading && !result && (
          <div className="lookup-empty">
            Không tìm thấy đơn hàng phù hợp. Vui lòng kiểm tra lại thông tin bạn đã nhập.
          </div>
        )}

        {result && statusInfo && statusInfo.timeline.length > 0 && (
          <div className="lookup-result">
            <div className="order-timeline-wrapper">
              <div className="order-timeline">
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

                <div className="timeline-steps">
                  {statusInfo.timeline.map((timelineItem, index) => {
                    const isCompleted = timelineItem.completed;
                    const isCurrent = !isCompleted && (index === 0 || statusInfo.timeline[index - 1].completed);

                    return (
                      <div key={index} className="timeline-step">
                        <div className={`timeline-icon-circle ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          {getStepIcon(timelineItem.step)}
                        </div>

                        <div className={`timeline-step-text ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                          {timelineItem.step}
                        </div>

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

            <div className="lookup-info-block">
              <div className="lookup-info-left">
                <div className="lookup-row">
                  <span className="label">Mã đơn</span>
                  <span className="value code">{result.maDonHang}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Khách hàng</span>
                  <span className="value">{result.tenKhachHang}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Số điện thoại</span>
                  <span className="value">{result.sdtKhachHang}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Địa chỉ giao hàng</span>
                  <span className="value">{formattedAddress || result.diaChiGiaoHang || "Chưa cập nhật"}</span>
                </div>
              </div>

              <div className="lookup-info-right">
                <div className="lookup-row">
                  <span className="label">Ngày đặt</span>
                  <span className="value">{formatDate(result.ngayDat)}</span>
                </div>
                <div className="lookup-row">
                  <span className="label">Hình thức thanh toán</span>
                  <span className="value">
                    {result.hinhThucThanhToan && result.hinhThucThanhToan.length > 0
                      ? result.hinhThucThanhToan.join(", ")
                      : "Chưa cập nhật"}
                  </span>
                </div>
                <div className="lookup-row">
                  <span className="label">Trạng thái</span>
                  <span className="value">
                    <Tag color={statusInfo.color}>
                      {statusInfo.label}
                    </Tag>
                  </span>
                </div>
              </div>
            </div>

            {result.danhSachSanPham && result.danhSachSanPham.length > 0 && (() => {
              // Gộp sản phẩm trùng lại
              const mergedProducts = mergeDuplicateProducts(result.danhSachSanPham);

              return (
                <div className="lookup-products">
                  <div className="products-title">Sản phẩm đã mua</div>
                  <div className="products-list">
                    {mergedProducts.map((item, index) => (
                      <div key={item.idOrderCT || (Array.isArray(item.idOrderCT) ? item.idOrderCT[0] : index)} className="product-item">
                        <div className="product-image">
                          <img
                            src={item.anhSanPham || "https://via.placeholder.com/80x80?text=Product"}
                            alt={item.tenSanPham}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/80x80?text=Product";
                            }}
                          />
                        </div>

                        <div className="product-info">
                          <div className="product-name">{item.tenSanPham}</div>
                          <div className="product-quantity">Số lượng: {item.soLuong}</div>
                        </div>
                        <div className="product-price">
                          {formatCurrency(item.thanhTien)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="lookup-summary">
              <div className="summary-title">Tổng tiền đơn hàng</div>
              <div className="summary-row">
                <span className="summary-label">Tổng tiền hàng</span>
                <span className="summary-value">
                  {formatCurrency(result.tongTienHang || 0)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Khuyến mãi</span>
                <span className="summary-value discount">
                  - {formatCurrency(result.khuyenMai || 0)}
                </span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Phí vận chuyển</span>
                <span className="summary-value">
                  {formatCurrency(result.phiVanChuyen || 0)}
                </span>
              </div>
              <div className="summary-divider" />
              <div className="summary-row total-row">
                <span className="summary-label">Tổng thanh toán</span>
                <span className="summary-value total">
                  {formatCurrency(result.tongThanhToan || 0)}
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