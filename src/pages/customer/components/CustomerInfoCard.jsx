import React, { useState, useEffect, useMemo } from 'react';
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { Card, Avatar, Spin } from 'antd';
import axios from 'axios';
import './CustomerInfoCard.css';

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

const CustomerInfoCard = ({ orders = [] }) => {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formattedAddress, setFormattedAddress] = useState("");

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCustomerInfo(parsedUser);
      } catch (error) {
        console.error("Lỗi khi parse thông tin khách hàng:", error);
      }
    }
    setLoading(false);
  }, []);

  const orderInfo = useMemo(() => {
    if (orders.length > 0) {
      const latestOrder = orders[0];
      return {
        name: latestOrder.customerName || customerInfo?.ten || "",
        phone: latestOrder.customerPhone || customerInfo?.soDienThoai || "",
        address: latestOrder.customerAddress || ""
      };
    }
    return {
      name: customerInfo?.ten || "",
      phone: customerInfo?.soDienThoai || "",
      address: ""
    };
  }, [orders, customerInfo]);

  useEffect(() => {
    const loadAddress = async () => {
      if (orderInfo.address) {
        try {
          const { provinceId, districtId, wardCode } = extractAddressIds(orderInfo.address);
          
          let addressDisplay = orderInfo.address || "";
          if (provinceId || districtId || wardCode) {
            const addressNames = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
            
            const addressParts = [];
            
            let originalAddress = "";
            if (orderInfo.address) {
              const addressPartsArray = orderInfo.address.split(',').map(p => p.trim());
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
          setFormattedAddress(orderInfo.address);
        }
      } else {
        setFormattedAddress("");
      }
    };

    loadAddress();
  }, [orderInfo.address]);

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum, order) => {
    const orderAmount = order.tongTienThuHo || 0;

 
    if (order.trangThai === 7) {
      return sum - orderAmount;
    }
  
    // Nếu đơn hàng bị hủy (trangThai === 7), trừ tiền đi
    if (order.trangThai === 7) {
      return sum - orderAmount;
    }
    // Các đơn hàng khác, cộng tiền vào

    return sum + orderAmount;
  }, 0);

  const joinedDate = React.useMemo(() => {
    if (orders.length > 0) {
      const firstOrder = orders[orders.length - 1];
      if (firstOrder.ngayTao) {
        const date = new Date(firstOrder.ngayTao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }
    }
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }, [orders]);

  const formatPrice = (price) => {
    return `${(price || 0).toLocaleString("vi-VN")} ₫`;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  if (loading) {
    return (
      <div className="customer-info-card-wrapper">
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  if (!customerInfo) {
    return (
      <div className="customer-info-card-wrapper">
        <Card className="customer-info-card">
          <div className="customer-info-empty">
            <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <p style={{ color: '#8c8c8c', fontSize: '16px' }}>Chưa có thông tin khách hàng</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="customer-info-card-wrapper">
      <Card className="customer-info-card" bordered={false}>
        <div className="customer-card-header-simple">
          <Avatar
            size={64}
            src={customerInfo.anh ? (
              customerInfo.anh.startsWith('http') 
                ? customerInfo.anh 
                : `http://localhost:8080${customerInfo.anh.startsWith('/') ? '' : '/'}${customerInfo.anh}`
            ) : null}
            icon={<UserOutlined />}
            className="customer-avatar-simple"
          >
            {!customerInfo.anh && getInitials(customerInfo.ten)}
          </Avatar>
          <div className="customer-header-info-simple">
            <h3 className="customer-name-simple">{customerInfo.ten || "Khách hàng"}</h3>
            <div className="customer-meta-simple">
              Thành viên từ {joinedDate}
            </div>
          </div>
        </div>

        <div className="customer-contact-section-simple">
          {/* <div className="info-item-simple">
            <UserOutlined className="info-icon-simple" />
            <div className="info-content-simple">
              <div className="info-label-simple">Họ và tên</div>
              <div className="info-value-simple">{orderInfo.name || customerInfo?.ten || "Chưa cập nhật"}</div>
            </div>
          </div> */}

          <div className="info-item-simple">
            <PhoneOutlined className="info-icon-simple" />
            <div className="info-content-simple">
              <div className="info-label-simple">Số điện thoại</div>
              <div className="info-value-simple">{orderInfo.phone || customerInfo?.soDienThoai || "Chưa cập nhật"}</div>
            </div>
          </div>

          {(formattedAddress || orderInfo.address) && (
            <div className="info-item-simple">
              <EnvironmentOutlined className="info-icon-simple" />
              <div className="info-content-simple">
                <div className="info-label-simple">Địa chỉ</div>
                <div className="info-value-simple" style={{ wordBreak: 'break-word' }}>
                  {formattedAddress || orderInfo.address || "Chưa cập nhật"}
                </div>
              </div>
            </div>
          )}

          <div className="info-item-simple">
            <MailOutlined className="info-icon-simple" />
            <div className="info-content-simple">
              <div className="info-label-simple">Email</div>
              <div className="info-value-simple">{customerInfo?.email || "Chưa cập nhật"}</div>
            </div>
          </div> 
        </div>

        <div className="customer-stats-section-simple">
          <div className="stat-item-simple">
            <ShoppingOutlined className="stat-icon-simple" />
            <div className="stat-content-simple">
              <div className="stat-value-simple">{totalOrders}</div>
              <div className="stat-label-simple">Tổng đơn hàng</div>
            </div>
          </div>

          <div className="stat-item-simple">
            <DollarOutlined className="stat-icon-simple" />
            <div className="stat-content-simple">
              <div className="stat-value-simple">{formatPrice(totalSpent)}</div>
              <div className="stat-label-simple">Tổng chi tiêu</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerInfoCard;

