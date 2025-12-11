import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCartOutlined, CreditCardOutlined, CheckCircleOutlined, DeleteOutlined, ArrowLeftOutlined, ShopOutlined, TruckOutlined, PlusOutlined, EditOutlined, EnvironmentOutlined, WalletOutlined, UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { message, Modal, Empty, Radio, Button, Checkbox } from "antd";
import { Select, Input, Spin } from 'antd';
import axios from 'axios';
import { getVoucherForBill } from '../../service/PhieuGiamGiaService';
import { getCartItems } from '../../service/CartCustomerService';
import { removeCartItem, createOrder } from '../../service/CartCustomerService';
import { getAllAddress, addAddress, deleteAddress, setDefaultAddress, updateAddress } from '../../service/AddressCustomerService';
import { createVNPayPayment } from '../../service/VNPayService';
import './CartPage.css';
const { Option } = Select;
const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const shopIdGHN = "5511482"; // Shop ID của GHN
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";
const urlShippingFee = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee";
const urlDayShip = "https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/leadtime";

// Cấu hình địa chỉ shop (cần cập nhật theo địa chỉ thực tế của shop)
const SHOP_CONFIG = {
    from_district_id: 1492, // ID huyện của shop
    from_ward_code: "1A0501", // Mã xã của shop
    service_type_id: 2, // Service type ID của GHN
};

const CartPage = () => {
    const [currentStep, setCurrentStep] = useState(0); // 0: Giỏ hàng, 1: Thông tin đặt hàng, 2: Hoàn tất
    const [orderProduct, setOrderProduct] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState(new Set()); // Set chứa ID các sản phẩm được chọn
    const [totalAmount, setTotalAmount] = useState(0);
    const [discountedTotal, setDiscountedTotal] = useState(0);
    const [discounts, setDiscounts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const dropdownRef = useRef(null);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [finalTotal, setFinalTotal] = useState(0);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [isCustomer, setIsCustomer] = useState(false);
    const [deliverToOther, setDeliverToOther] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showAddAddressForm, setShowAddAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null); // ID địa chỉ đang edit
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [shippingFee, setShippingFee] = useState(0); // Phí ship sẽ được tính từ API
    const [shippingFeeLoading, setShippingFeeLoading] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [shippingDate, setShippingDate] = useState(""); // Ngày ship dự kiến
    const [shippingDateLoading, setShippingDateLoading] = useState(false);
    const [isVNPayProcessing, setIsVNPayProcessing] = useState(false);
    const [isDeliveryProcessing, setIsDeliveryProcessing] = useState(false);
    const [isBuyNow, setIsBuyNow] = useState(false); // Lưu trạng thái buyNow để hiển thị voucher

    // Ban đầu để trống, sẽ lấy từ API
    const [addresses, setAddresses] = useState([]);

    // Form thêm địa chỉ mới
    const [newAddressForm, setNewAddressForm] = useState({
        name: "",
        phone: "",
        address: "",
        provinceId: null,
        districtId: null,
        wardCode: null,
    });

    // Form edit địa chỉ
    const [editAddressForm, setEditAddressForm] = useState({
        name: "",
        phone: "",
        address: "",
        provinceId: null,
        districtId: null,
        wardCode: null,
    });

    // Validation errors cho form địa chỉ mới
    const [newAddressErrors, setNewAddressErrors] = useState({
        name: '',
        phone: '',
        address: '',
        provinceId: '',
        districtId: '',
        wardCode: ''
    });

    // Validation errors cho form edit địa chỉ
    const [editAddressErrors, setEditAddressErrors] = useState({
        name: '',
        phone: '',
        address: '',
        provinceId: '',
        districtId: '',
        wardCode: ''
    });

    const [formData, setFormData] = useState({
        deliveryMethod: "delivery",
        paymentMethod: "delivery", // Mặc định là thanh toán khi nhận hàng
        provinceId: null,
        districtId: null,
        wardCode: null,
        address: "",
        fullName: "",
        phone: "",
        email: "",
        note: "", // Ghi chú đơn hàng
    });
    const [loading, setLoading] = useState({
        province: false,
        district: false,
        ward: false,
    });

    // Tính phí ship từ GHN API (dùng GET request theo mẫu)
    const calculateShippingFee = async (toDistrictId, toWardCode) => {
        if (!toDistrictId || !toWardCode) {
            setShippingFee(0);
            return;
        }

        // Tính số lượng sản phẩm (mỗi sản phẩm = 1)
        let quantityProducts = orderProduct.length || 1;

        setShippingFeeLoading(true);
        try {
            const response = await axios.get(urlShippingFee, {
                params: {
                    insurance_value: "",
                    coupon: "",
                    service_type_id: SHOP_CONFIG.service_type_id,
                    from_district_id: SHOP_CONFIG.from_district_id,
                    from_ward_code: SHOP_CONFIG.from_ward_code,
                    to_district_id: parseInt(toDistrictId),
                    to_ward_code: String(toWardCode),
                    height: 50,
                    length: 20,
                    weight: 200,
                    width: 20,
                },
                headers: {
                    token: tokenApiGHN,
                    shop_id: shopIdGHN,
                }
            });

            console.log("📦 Response tính phí ship:", response.data);

            if (response.data && response.data.data) {
                const totalShip = response.data.data;
                if (totalShip && totalShip.total !== undefined) {
                    console.log("Tiền ship:", totalShip.total);
                    // Lưu phí ship gốc từ API (sẽ được áp dụng logic free ship trong useEffect tính finalTotal)
                    setShippingFee(totalShip.total);
                } else {
                    console.log("Không có giá trị total.");
                    setShippingFee(0);
                    message.warning("Không thể tính phí vận chuyển.");
                }
            } else {
                console.error("Không thể tính phí ship - Response không hợp lệ:", response.data);
                setShippingFee(0);
                message.warning("Không thể tính phí vận chuyển. Vui lòng kiểm tra lại địa chỉ.");
            }
        } catch (error) {
            console.error("❌ Lỗi khi tính phí ship:", error);
            console.error("❌ Error response:", error.response?.data);
            setShippingFee(0);
            message.warning("Không thể tính phí vận chuyển. Vui lòng thử lại sau.");
        } finally {
            setShippingFeeLoading(false);
        }
    };

    // Lấy ngày ship dự kiến từ GHN API
    const fetchDayShip = async (toDistrictId, toWardCode) => {
        if (!toDistrictId || !toWardCode) {
            setShippingDate("");
            return;
        }

        console.log("📅 Gọi API lấy ngày ship");

        setShippingDateLoading(true);
        try {
            const response = await axios.get(urlDayShip, {
                params: {
                    from_district_id: SHOP_CONFIG.from_district_id,
                    from_ward_code: SHOP_CONFIG.from_ward_code,
                    to_district_id: parseInt(toDistrictId),
                    to_ward_code: String(toWardCode),
                    service_id: 53320,
                },
                headers: {
                    token: tokenApiGHN,
                    shop_id: shopIdGHN,
                }
            });

            console.log("📅 Response ngày ship:", response.data);

            if (response.data && response.data.data) {
                const dayShip = response.data.data;
                const leadTime = dayShip.leadtime;

                if (leadTime) {
                    const date = new Date(leadTime * 1000);
                    const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
                    setShippingDate(formattedDate);
                    console.log("📅 Ngày ship dự kiến:", formattedDate);
                } else {
                    setShippingDate("");
                }
            } else {
                console.log("Không có dữ liệu ngày ship.");
                setShippingDate("");
            }
        } catch (error) {
            console.error("❌ Lỗi khi lấy ngày ship:", error);
            console.error("❌ Error response:", error.response?.data);
            setShippingDate("");
        } finally {
            setShippingDateLoading(false);
        }
    };

    // Helper: Extract ID từ địa chỉ object (xử lý nhiều format khác nhau)
    const extractAddressIds = (a) => {
        let provinceId = a.provinceId || a.tinhThanhId || a.province_id || null;
        let districtId = a.districtId || a.quanHuyenId || a.district_id || null;
        let wardCode = a.wardCode || a.phuongXaCode || a.ward_code || null;
        
        // Nếu không có ID field, kiểm tra xem tinhThanh/quanHuyen/phuongXa có phải là ID không
        // Ưu tiên kiểm tra tinhThanh/quanHuyen/phuongXa vì API có thể trả về ID ở đây
        if (!provinceId && a.tinhThanh) {
            const tinhThanhValue = a.tinhThanh;
            // Kiểm tra nếu là số (có thể là string "267" hoặc number 267)
            const isNumeric = !isNaN(tinhThanhValue) && tinhThanhValue !== "" && typeof tinhThanhValue !== 'object';
            if (isNumeric) {
                provinceId = typeof tinhThanhValue === 'string' ? parseInt(tinhThanhValue) : tinhThanhValue;
                console.log(`✅ Extract provinceId từ tinhThanh: "${tinhThanhValue}" → ${provinceId}`);
            }
        }
        if (!districtId && a.quanHuyen) {
            const quanHuyenValue = a.quanHuyen;
            const isNumeric = !isNaN(quanHuyenValue) && quanHuyenValue !== "" && typeof quanHuyenValue !== 'object';
            if (isNumeric) {
                districtId = typeof quanHuyenValue === 'string' ? parseInt(quanHuyenValue) : quanHuyenValue;
                console.log(`✅ Extract districtId từ quanHuyen: "${quanHuyenValue}" → ${districtId}`);
            }
        }
        if (!wardCode && a.phuongXa) {
            const phuongXaValue = a.phuongXa;
            // Ward code có thể là string (không phải số), nên chỉ cần kiểm tra không rỗng
            if (phuongXaValue !== "" && typeof phuongXaValue !== 'object') {
                wardCode = phuongXaValue;
                console.log(`✅ Extract wardCode từ phuongXa: "${phuongXaValue}" → ${wardCode}`);
            }
        }
        
        console.log("🔍 extractAddressIds result:", { provinceId, districtId, wardCode });
        return { provinceId, districtId, wardCode };
    };

    // Helper: Load tên tỉnh/huyện/xã từ ID
    const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
        const result = {
            provinceName: "",
            districtName: "",
            wardName: ""
        };

        try {
            // Load tên tỉnh - API có thể trả về object đơn lẻ hoặc array
            if (provinceId) {
                try {
                    // Chuyển đổi ID sang số nếu cần
                    const provinceIdNum = typeof provinceId === 'string' ? parseInt(provinceId) : provinceId;
                    
                    const resProvince = await axios.get(urlProvince, {
                        headers: { token: tokenApiGHN }
                    });
                    
                    // Xử lý cả trường hợp API trả về object đơn lẻ hoặc array
                    let province = null;
                    if (Array.isArray(resProvince.data.data)) {
                        province = resProvince.data.data.find(p => 
                            p.ProvinceID === provinceIdNum || 
                            p.ProvinceID === provinceId ||
                            String(p.ProvinceID) === String(provinceId)
                        );
                    } else if (resProvince.data.data && resProvince.data.data.ProvinceID) {
                        // Nếu API trả về object đơn lẻ
                        const p = resProvince.data.data;
                        if (p.ProvinceID === provinceIdNum || p.ProvinceID === provinceId || String(p.ProvinceID) === String(provinceId)) {
                            province = p;
                        }
                    }
                    
                    if (province && province.ProvinceName) {
                        result.provinceName = province.ProvinceName;
                        console.log(`✅ Load tên tỉnh: ID ${provinceId} → ${province.ProvinceName}`);
                    } else {
                        console.warn(`⚠️ Không tìm thấy tỉnh với ID: ${provinceId}`);
                    }
                } catch (err) {
                    console.error("Lỗi khi load tên tỉnh:", err);
                }
            }

            // Load tên huyện
            if (districtId) {
                try {
                    const districtIdNum = typeof districtId === 'string' ? parseInt(districtId) : districtId;
                    
                    // Nếu có provinceId, dùng nó để filter, nếu không thì load tất cả
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
                        console.log(`✅ Load tên huyện: ID ${districtId} → ${district.DistrictName}`);
                    } else {
                        console.warn(`⚠️ Không tìm thấy huyện với ID: ${districtId}`);
                    }
                } catch (err) {
                    console.error("Lỗi khi load tên huyện:", err);
                }
            }

            // Load tên xã
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
                        console.log(`✅ Load tên xã: Code ${wardCode} → ${ward.WardName}`);
                    } else {
                        console.warn(`⚠️ Không tìm thấy xã với Code: ${wardCode}`);
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

    // Helper: load districts + wards theo id để select hiển thị chính xác
    const loadDistrictsAndWards = async (provinceId, districtId) => {
        if (!provinceId) {
            setDistricts([]);
            setWards([]);
            return;
        }

        setLoading(prev => ({ ...prev, district: true }));
        try {
            const resD = await axios.get(urlDistricts, {
                params: { province_id: provinceId },
                headers: { token: tokenApiGHN }
            });
            const newDistricts = resD.data.data || [];
            setDistricts(newDistricts);

            if (districtId) {
                setLoading(prev => ({ ...prev, ward: true }));
                try {
                    const resW = await axios.get(urlWard, {
                        params: { district_id: districtId },
                        headers: { token: tokenApiGHN }
                    });
                    setWards(resW.data.data || []);
                } catch (err) {
                    console.error("Lỗi khi load wards:", err);
                    setWards([]);
                } finally {
                    setLoading(prev => ({ ...prev, ward: false }));
                }
            } else {
                setWards([]);
            }
        } catch (err) {
            console.error("Lỗi khi load districts:", err);
            setDistricts([]);
            setWards([]);
        } finally {
            setLoading(prev => ({ ...prev, district: false }));
        }
    };

    // Lấy danh sách địa chỉ của khách hàng 
    useEffect(() => {
        if (!isCustomer) return;

        const fetchAddresses = async () => {
            try {
                setAddressLoading(true);
                const customerId = localStorage.getItem("isUser");
                if (customerId) {
                    const response = await getAllAddress(customerId);
                    console.log("Địa chỉ khách hàng raw:", response);
                    const raw = Array.isArray(response) ? response : response?.data || [];

                    // Chuẩn hóa dữ liệu trả về (fallback cho nhiều cấu trúc)
                    const mappedPromises = raw.map(async (a) => {
                        const id = a.id || a.idDiaChi || a.idDiaChiKhac || a.idAddress;
                        const name = a.name || a.ten || a.hoTen || a.ho_ten || "";
                        const phone = a.phone || a.soDienThoai || a.so_dien_thoai || "";
                        const addressText = a.address || a.diaChiChiTiet || a.diaChi || a.dia_chi || "";
                        // Extract IDs từ object
                        const { provinceId, districtId, wardCode } = extractAddressIds(a);
                        const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh || a.diacChiMacDinh || a.diacChiMacDinh === true);

                        // Lấy tên hiện tại (nếu có)
                        let province = a.province || a.tinhThanhPho || a.tinh_thanh || "";
                        let district = a.district || a.quan_huyen || "";
                        let ward = a.ward || a.phuong_xa || "";

                        // Luôn gọi API để lấy tên từ ID nếu có ID
                        // Kiểm tra xem tên hiện tại có phải là ID (số) không
                        const provinceIsId = provinceId && (!province || !isNaN(province) || province === String(provinceId) || province === provinceId);
                        const districtIsId = districtId && (!district || !isNaN(district) || district === String(districtId) || district === districtId);
                        const wardIsId = wardCode && (!ward || !isNaN(ward) || ward === String(wardCode) || ward === wardCode);
                        
                        if (provinceId || districtId || wardCode) {
                            console.log(`🔄 Loading tên địa chỉ từ ID:`, { 
                                provinceId, 
                                districtId, 
                                wardCode,
                                currentNames: { province, district, ward }
                            });
                            const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                            if (names.provinceName) province = names.provinceName;
                            if (names.districtName) district = names.districtName;
                            if (names.wardName) ward = names.wardName;
                        }

                        return {
                            ...a,
                            id,
                            name,
                            phone,
                            address: addressText,
                            province,
                            district,
                            ward,
                            provinceId,
                            districtId,
                            wardCode,
                            isDefault
                        };
                    });

                    // Đợi tất cả các promise hoàn thành
                    const mapped = await Promise.all(mappedPromises);
                    setAddresses(mapped);
                }
            } catch (error) {
                console.error("Lỗi khi lấy danh sách địa chỉ:", error);
                message.error("Không thể tải danh sách địa chỉ");
            } finally {
                setAddressLoading(false);
            }
        };

        fetchAddresses();
    }, [isCustomer]);

    // set isCustomer từ localStorage
    useEffect(() => {
        const customerStatus = localStorage.getItem("isCustomer") === "true";
        setIsCustomer(customerStatus);
    }, []);

    // khi chọn địa chỉ: điền cả id tỉnh/huyện/xã và load select tương ứng
    const handleSelectAddress = async (address) => {
        const id = address.id || address.idDiaChi || address.idAddress;
        setSelectedAddressId(id);

        const provinceId = address.provinceId || address.tinhThanhId || null;
        const districtId = address.districtId || address.quanHuyenId || null;
        const wardCode = address.wardCode || null;

        setFormData(prev => ({
            ...prev,
            fullName: address.name,
            phone: address.phone,
            address: address.address,
            provinceId,
            districtId,
            wardCode,
        }));

        // load districts/wards để selects hiển thị đúng option
        if (provinceId) {
            await loadDistrictsAndWards(provinceId, districtId);
        }

        // Tính phí ship và ngày ship khi có đủ thông tin
        if (districtId && wardCode) {
            await calculateShippingFee(districtId, wardCode);
            await fetchDayShip(districtId, wardCode);
        }

        setDeliverToOther(false); // Reset về địa chỉ mặc định
        setShowAddressModal(false);
        message.success("Đã chọn địa chỉ giao hàng!");
    };

    // sêt mặc định địa chỉ
    const handleSetDefaultAddress = async (addressId) => {
        Modal.confirm({
            title: 'Xác nhận đặt mặc định',
            content: 'Bạn có chắc chắn muốn đặt địa chỉ này làm mặc định?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                await performSetDefaultAddress(addressId);
            },
        });
    };

    const performSetDefaultAddress = async (addressId) => {
        try {
            await setDefaultAddress(addressId);
            message.success("Đặt địa chỉ mặc định thành công!");

            // Làm mới danh sách
            const customerId = localStorage.getItem("isUser");
            const updatedAddresses = await getAllAddress(customerId);
            const raw = Array.isArray(updatedAddresses) ? updatedAddresses : updatedAddresses?.data || [];
            // Chuẩn hoá như fetchAddresses
            const mappedPromises = raw.map(async (a) => {
                const id = a.id || a.idDiaChi || a.idAddress;
                const name = a.name || a.ten || a.hoTen || "";
                const phone = a.phone || a.soDienThoai || "";
                const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";
                const { provinceId, districtId, wardCode } = extractAddressIds(a);
                const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh || a.diacChiMacDinh || false);

                // Load tên từ ID
                let province = a.province || a.tinhThanhPho || a.tinh_thanh || "";
                let district = a.district || a.quan_huyen || "";
                let ward = a.ward || a.phuong_xa || "";

                if (provinceId || districtId || wardCode) {
                    const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                    if (names.provinceName) province = names.provinceName;
                    if (names.districtName) district = names.districtName;
                    if (names.wardName) ward = names.wardName;
                }

                return {
                    ...a,
                    id,
                    name,
                    phone,
                    address: addressText,
                    province,
                    district,
                    ward,
                    provinceId,
                    districtId,
                    wardCode,
                    isDefault
                };
            });
            const mapped = await Promise.all(mappedPromises);
            
            // Sắp xếp: địa chỉ mặc định lên đầu
            const sorted = mapped.sort((a, b) => {
                if (a.isDefault && !b.isDefault) return -1;
                if (!a.isDefault && b.isDefault) return 1;
                return 0;
            });
            
            setAddresses(sorted);
            
            // Tự động chọn địa chỉ mặc định
            const defaultAddr = sorted.find(addr => addr.isDefault);
            if (defaultAddr) {
                const defaultId = defaultAddr.id || defaultAddr.idDiaChi || defaultAddr.idAddress;
                setSelectedAddressId(defaultId);
            }
        } catch (error) {
            console.error("Lỗi khi đặt địa chỉ mặc định:", error);
            message.error("Đặt địa chỉ mặc định thất bại");
        }
    };

    // xóa địa chỉ
    const handleDeleteAddress = async (addressId) => {
        Modal.confirm({
            title: "Xóa địa chỉ",
            content: "Bạn có chắc chắn muốn xóa địa chỉ này?",
            okText: "Xóa",
            cancelText: "Hủy",
            okType: "danger",
            onOk: async () => {
                try {
                    await deleteAddress(addressId);
                    message.success("Xóa địa chỉ thành công!");

                    // Làm mới danh sách
                    const customerId = localStorage.getItem("isUser");
                    const updatedAddresses = await getAllAddress(customerId);
                    const raw = Array.isArray(updatedAddresses) ? updatedAddresses : updatedAddresses?.data || [];
                    const mappedPromises = raw.map(async (a) => {
                        const id = a.id || a.idDiaChi || a.idAddress;
                        const name = a.name || a.ten || a.hoTen || "";
                        const phone = a.phone || a.soDienThoai || "";
                        const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";
                        const provinceId = a.provinceId || a.tinhThanhId || a.tinhThanh || null;
                        const districtId = a.districtId || a.quanHuyenId || a.quanHuyen || null;
                        const wardCode = a.wardCode || a.phuongXaCode || a.phuongXa || null;
                        const isDefault = !!(a.isDefault || a.diaChiMacDinh || false);

                        // Load tên từ ID nếu chưa có
                        let province = a.province || a.tinhThanh || a.tinhThanhPho || a.tinh_thanh || "";
                        let district = a.district || a.quanHuyen || a.quan_huyen || "";
                        let ward = a.ward || a.phuongXa || a.phuong_xa || "";

                        if ((provinceId && !province) || (districtId && !district) || (wardCode && !ward)) {
                            const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                            province = names.provinceName || province;
                            district = names.districtName || district;
                            ward = names.wardName || ward;
                        }

                        return {
                            ...a,
                            id,
                            name,
                            phone,
                            address: addressText,
                            province,
                            district,
                            ward,
                            provinceId,
                            districtId,
                            wardCode,
                            isDefault
                        };
                    });
                    const mapped = await Promise.all(mappedPromises);
                    setAddresses(mapped);
                } catch (error) {
                    console.error("Lỗi khi xóa địa chỉ:", error);
                    message.error("Xóa địa chỉ thất bại");
                }
            }
        });
    };

    // Hàm fetchCartItems được tách ra để có thể gọi lại từ các hàm khác
    const fetchCartItems = async () => {
        if (!isCustomer) return;
        
        try {
            const idCustomer = localStorage.getItem("isUser");
            const response = await getCartItems(idCustomer);

            console.log("API giỏ hàng trả về:", response);

            // Luôn đảm bảo trả về array
            const rawItems = response?.sanPhams ?? [];
            console.log("📦 rawItems từ API:", rawItems);
            console.log("📦 rawItems[0] (mẫu):", rawItems[0]);
            const normalizedItems = normalizeCartData(rawItems);
            console.log("📦 normalizedItems sau khi normalize:", normalizedItems);
            console.log("📦 normalizedItems[0] (mẫu):", normalizedItems[0]);
            setOrderProduct(normalizedItems);
            
            // Xử lý "Mua ngay": tự động chọn sản phẩm và chuyển đến bước thanh toán
            const buyNowFlag = sessionStorage.getItem("buyNow");
            if (buyNowFlag) {
                try {
                    const buyNowData = JSON.parse(buyNowFlag);
                    if (buyNowData.enabled && normalizedItems.length > 0) {
                        // Tìm sản phẩm theo idSpct hoặc id
                        let productToSelect = null;
                        if (buyNowData.productId) {
                            productToSelect = normalizedItems.find(item => 
                                String(item.idSpct || item.id) === String(buyNowData.productId)
                            );
                        }
                        // Nếu không tìm thấy theo ID, lấy sản phẩm cuối cùng (mới nhất)
                        if (!productToSelect) {
                            productToSelect = normalizedItems[normalizedItems.length - 1];
                        }
                        
                        if (productToSelect) {
                            const itemId = String(productToSelect.idSpct || productToSelect.id || `temp-${normalizedItems.length - 1}`);
                            setSelectedProducts(new Set([itemId]));
                            setIsBuyNow(true);
                            setTimeout(() => {
                                setCurrentStep(1);
                                window.scrollTo(0, 0);
                            }, 100);
                            setTimeout(() => {
                                sessionStorage.removeItem("buyNow");
                            }, 200);
                        } else {
                            sessionStorage.removeItem("buyNow");
                        }
                    } else {
                        sessionStorage.removeItem("buyNow");
                    }
                } catch (err) {
                    console.error("Lỗi khi xử lý buyNow flag:", err);
                    sessionStorage.removeItem("buyNow");
                }
            }
        } catch (error) {
            console.error("Lỗi khi lấy giỏ hàng:", error);
            setOrderProduct([]); // tránh lỗi reduce/map
        }
    };

    useEffect(() => {
        if (!isCustomer) return;
        fetchCartItems();
    }, [isCustomer]);

    useEffect(() => {
        const fetchProvinces = async () => {
            setLoading((prev) => ({ ...prev, province: true }));
            try {
                const res = await axios.get(urlProvince, {
                    headers: { token: tokenApiGHN },
                });
                setProvinces(res.data.data || []);
            } catch (error) {
                console.error("Lỗi khi lấy tỉnh:", error);
            } finally {
                setLoading((prev) => ({ ...prev, province: false }));
            }
        };
        fetchProvinces();
    }, []);

    const handleProvinceChange = async (provinceId) => {
        setFormData((prev) => ({
            ...prev,
            provinceId,
            districtId: null,
            wardCode: null,
        }));
        setDistricts([]);
        setWards([]);

        if (!provinceId) return;

        setLoading((prev) => ({ ...prev, district: true }));
        try {
            const res = await axios.get(urlDistricts, {
                params: { province_id: provinceId },
                headers: { token: tokenApiGHN },
            });
            setDistricts(res.data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy huyện:", error);
        } finally {
            setLoading((prev) => ({ ...prev, district: false }));
        }
    };

    const handleDistrictChange = async (districtId) => {
        setFormData((prev) => ({
            ...prev,
            districtId,
            wardCode: null,
        }));
        setWards([]);
        setShippingFee(0); // Reset phí ship khi thay đổi huyện

        if (!districtId) return;

        setLoading((prev) => ({ ...prev, ward: true }));
        try {
            const res = await axios.get(urlWard, {
                params: { district_id: districtId },
                headers: { token: tokenApiGHN },
            });
            setWards(res.data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy xã:", error);
        } finally {
            setLoading((prev) => ({ ...prev, ward: false }));
        }
    };

    // Hàm riêng để load districts cho form thêm địa chỉ
    const loadDistrictsForNewAddress = async (provinceId) => {
        if (!provinceId) {
            setDistricts([]);
            setWards([]);
            return;
        }

        setLoading((prev) => ({ ...prev, district: true }));
        try {
            const res = await axios.get(urlDistricts, {
                params: { province_id: provinceId },
                headers: { token: tokenApiGHN },
            });
            setDistricts(res.data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy huyện:", error);
            setDistricts([]);
        } finally {
            setLoading((prev) => ({ ...prev, district: false }));
        }
    };

    // Hàm riêng để load wards cho form thêm địa chỉ
    const loadWardsForNewAddress = async (districtId) => {
        if (!districtId) {
            setWards([]);
            return;
        }

        setLoading((prev) => ({ ...prev, ward: true }));
        try {
            const res = await axios.get(urlWard, {
                params: { district_id: districtId },
                headers: { token: tokenApiGHN },
            });
            setWards(res.data.data || []);
        } catch (error) {
            console.error("Lỗi khi lấy xã:", error);
            setWards([]);
        } finally {
            setLoading((prev) => ({ ...prev, ward: false }));
        }
    };
    const handleWardChange = async (wardCode) => {
        setFormData((prev) => ({ ...prev, wardCode }));
        
        // Tính phí ship và ngày ship khi có đủ thông tin (districtId và wardCode)
        const currentDistrictId = formData.districtId;
        if (currentDistrictId && wardCode) {
            await calculateShippingFee(currentDistrictId, wardCode);
            await fetchDayShip(currentDistrictId, wardCode);
        }
    };
    const handleAddressChange = (e) => {
        setFormData((prev) => ({ ...prev, address: e.target.value }));
    };

    useEffect(() => {
        const saved = localStorage.getItem("orderProduct");
        console.log("localStorage data:", saved);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const items = Array.isArray(parsed) ? parsed : [parsed];
                setOrderProduct(items);
                
                const buyNowFlag = sessionStorage.getItem("buyNow");
                if (buyNowFlag) {
                    try {
                        const buyNowData = JSON.parse(buyNowFlag);
                        if (buyNowData.enabled && items.length > 0) {
                            let productToSelect = null;
                            if (buyNowData.productId) {
                                productToSelect = items.find(item => 
                                    String(item.id || item.idSpct) === String(buyNowData.productId)
                                );
                            }
                            // Nếu không tìm thấy theo ID, lấy sản phẩm cuối cùng
                            if (!productToSelect) {
                                productToSelect = items[items.length - 1];
                            }
                            
                            if (productToSelect) {
                                const itemId = String(productToSelect.idSpct || productToSelect.id || `temp-${items.length - 1}`);
                                setSelectedProducts(new Set([itemId]));
                                setIsBuyNow(true);
                                setTimeout(() => {
                                    setCurrentStep(1);
                                    window.scrollTo(0, 0);
                                }, 100);
                                setTimeout(() => {
                                    sessionStorage.removeItem("buyNow");
                                }, 200);
                            } else {
                                sessionStorage.removeItem("buyNow");
                            }
                        } else {
                            sessionStorage.removeItem("buyNow");
                        }
                    } catch (err) {
                        console.error("Lỗi khi xử lý buyNow flag:", err);
                        sessionStorage.removeItem("buyNow");
                    }
                }
            } catch (err) {
                console.error("Lỗi parse localStorage:", err);
            }
        }
    }, []);

    useEffect(() => {
        if (selectedDiscount) {
            let discountValue = 0;

            if (selectedDiscount.giaTriGiam < 100.00) {
                // Giảm theo phần trăm
                // Kiểm tra điều kiện đơn tối thiểu (giaTriMin)
                if (selectedDiscount.giaTriMin && totalAmount < selectedDiscount.giaTriMin) {
                    // Không đủ điều kiện, không áp dụng giảm giá
                    setAppliedDiscount(0);
                    const actualShippingFee = totalAmount >= 5000000 ? 0 : shippingFee;
                    setFinalTotal(totalAmount + actualShippingFee);
                    return;
                }

                // Tính giảm giá theo phần trăm
                discountValue = totalAmount * (selectedDiscount.giaTriGiam / 100);
                
                // Giới hạn mức giảm tối đa (giaTriMax) - chỉ áp dụng cho loại phần trăm
                if (selectedDiscount.giaTriMax && discountValue > selectedDiscount.giaTriMax) {
                    discountValue = selectedDiscount.giaTriMax;
                }
            } else {
                // Giảm theo số tiền cố định (giaTriGiam >= 100.00)
                // Không kiểm tra giaTriMin và giaTriMax, giảm trực tiếp theo giaTriGiam
                discountValue = selectedDiscount.giaTriGiam;
            }

            setAppliedDiscount(discountValue);
            const totalAfterDiscount = totalAmount - discountValue;
            // Kiểm tra free ship: nếu tổng tiền sau giảm giá >= 5 triệu thì free ship
            const actualShippingFee = totalAfterDiscount >= 5000000 ? 0 : shippingFee;
            setFinalTotal(Math.max(totalAfterDiscount + actualShippingFee, 0));
        } else {
            setAppliedDiscount(0);
            // Kiểm tra free ship: nếu tổng tiền >= 5 triệu thì free ship
            const actualShippingFee = totalAmount >= 5000000 ? 0 : shippingFee;
            setFinalTotal(totalAmount + actualShippingFee);
        }
    }, [totalAmount, selectedDiscount, shippingFee]);

    // Tính tổng tiền chỉ cho sản phẩm được chọn
    useEffect(() => {
        const total = orderProduct
            .filter((item, index) => {
                const itemId = String(item.idSpct || item.id || `temp-${index}`);
                return selectedProducts.has(itemId);
            })
            .reduce((sum, item) => sum + item.price, 0);
        setTotalAmount(total);
        console.log("Check totalamount", total);
    }, [orderProduct, selectedProducts]);

    useEffect(() => {
        const getVoucher = async (totalPriceAmount) => {
            try {
                const response = await getVoucherForBill(totalPriceAmount);
                setDiscounts(response);
                console.log("Voucher response:", response);
            } catch (error) {
                console.error("Lỗi khi lấy voucher cho hóa đơn:", error);
            }
        };

        console.log("🔍 Total amount hiện tại:", totalAmount);
        if (totalAmount > 0) {
            getVoucher(totalAmount);
        }
    }, [totalAmount]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const applyDiscount = (voucher) => {
        console.log("🎫 Voucher được chọn:", voucher);
        setSelectedDiscount(voucher);
        setDiscountCode(voucher.ten);
        setShowDropdown(false);
        message.success(`Đã chọn mã ${voucher.ten}`);
    };


    const removeItem = (id) => {
        const updated = orderProduct.filter(item => item.id !== id);
        setOrderProduct(updated);
        localStorage.setItem("orderProduct", JSON.stringify(updated));
    };

    // Xóa sản phẩm khỏi giỏ hàng
    const deleteCartItem = async (id) => {
        Modal.confirm({
            title: "Xóa sản phẩm",
            content: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
            okText: "Xóa",
            cancelText: "Hủy",
            okType: "danger",
            onOk: async () => {
                try {
                    
                    // Tìm item để lấy idGiohang
                    const item = orderProduct.find(p => p.id === id);
                    
                    if (!item) {
                        message.error("Không tìm thấy sản phẩm!");
                        return;
                    }

                    // Xóa khỏi selectedProducts nếu có
                    setSelectedProducts(prev => {
                        const newSet = new Set(prev);
                        const itemId = item.idSpct || item.id;
                        newSet.delete(itemId);
                        return newSet;
                    });

                    // Nếu có idGiohang, gọi API xóa trực tiếp
                    if (item.idGiohang) {
                        await removeCartItem(item.idGiohang);
                        message.success("Đã xóa sản phẩm khỏi giỏ hàng");
                        
                        // Reload lại danh sách giỏ hàng từ API
                        if (isCustomer) {
                            await fetchCartItems();
                        }
                        
                        window.dispatchEvent(new Event('cartUpdated'));
                    } else {
                        const updated = orderProduct.filter(item => item.id !== id);
                        setOrderProduct(updated);
                        
                        if (!isCustomer) {
                            if (updated.length > 0) {
                                localStorage.setItem("orderProduct", JSON.stringify(updated));
                            } else {
                                localStorage.removeItem("orderProduct");
                            }
                        }
                        message.success("Đã xóa sản phẩm khỏi giỏ hàng");
                    }
                } catch (error) {
                    console.error("❌ Lỗi khi xóa sản phẩm:", error);
                    message.error("Không thể xóa sản phẩm. Vui lòng thử lại!");
                }
            }
        });
    };

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // Mở form edit địa chỉ và tự động load districts/wards
    const handleEditAddress = async (address) => {
        const { provinceId, districtId, wardCode } = extractAddressIds(address);
        
        setEditAddressForm({
            name: address.name || address.hoTen || "",
            phone: address.phone || address.soDienThoai || "",
            address: address.address || address.diaChiChiTiet || "",
            provinceId: provinceId,
            districtId: districtId,
            wardCode: wardCode,
        });
        
        setEditingAddressId(address.id || address.idDiaChi || address.idAddress);
        setShowAddAddressForm(false); // Đóng form thêm nếu đang mở
        
        // Load districts và wards nếu có provinceId
        if (provinceId) {
            await loadDistrictsForNewAddress(provinceId);
            if (districtId) {
                await loadWardsForNewAddress(districtId);
            }
        }
    };

    // Cập nhật địa chỉ
    const handleUpdateAddress = async () => {
        if (!validateEditAddressForm()) {
            message.error('Vui lòng kiểm tra lại thông tin đã nhập');
            return;
        }

        Modal.confirm({
            title: 'Xác nhận cập nhật',
            content: 'Bạn có chắc chắn muốn cập nhật địa chỉ này?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                await performUpdateAddress();
            },
        });
    };

    const performUpdateAddress = async () => {
        try {
            setAddressLoading(true);
            
            const addressData = {
                hoTen: editAddressForm.name.trim(),
                soDienThoai: editAddressForm.phone.trim(),
                diaChiChiTiet: editAddressForm.address.trim(),
                tinhThanh: editAddressForm.provinceId,
                quanHuyen: editAddressForm.districtId,
                phuongXa: editAddressForm.wardCode,
            };


            await updateAddress(editingAddressId, addressData);
            message.success("Cập nhật địa chỉ thành công!");

            const customerId = localStorage.getItem("isUser");
            const updated = await getAllAddress(customerId);
            const raw = Array.isArray(updated) ? updated : updated?.data || [];
            
            if (!raw || raw.length === 0) {
                console.warn("⚠️ Không có địa chỉ nào được trả về");
                setAddresses([]);
            } else {
                const mappedPromises = raw.map(async (a) => {
                    const id = a.id || a.idDiaChi || a.idAddress;
                    const name = a.name || a.ten || a.hoTen || "";
                    const phone = a.phone || a.soDienThoai || "";
                    const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";
                    const { provinceId, districtId, wardCode } = extractAddressIds(a);
                    const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh || false);

                    // Load tên từ ID
                    let province = a.province || a.tinhThanhPho || a.tinh_thanh || "";
                    let district = a.district || a.quan_huyen || "";
                    let ward = a.ward || a.phuong_xa || "";

                    if (provinceId || districtId || wardCode) {
                        const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                        if (names.provinceName) province = names.provinceName;
                        if (names.districtName) district = names.districtName;
                        if (names.wardName) ward = names.wardName;
                    }

                    return {
                        ...a,
                        id,
                        name,
                        phone,
                        address: addressText,
                        province,
                        district,
                        ward,
                        provinceId,
                        districtId,
                        wardCode,
                        isDefault
                    };
                });
                const mapped = await Promise.all(mappedPromises);
                
                const sorted = mapped.sort((a, b) => {
                    const aId = String(a.id || '');
                    const bId = String(b.id || '');
                    const editId = String(editingAddressId || '');
                    const aIsUpdated = aId === editId;
                    const bIsUpdated = bId === editId;
                    
                    if (a.isDefault && !b.isDefault) return -1;
                    if (!a.isDefault && b.isDefault) return 1;
                    
                    if (aIsUpdated && !bIsUpdated) return -1;
                    if (!aIsUpdated && bIsUpdated) return 1;
                    
                    return 0;
                });
                
                setAddresses(sorted);
            }

            // Reset form
            setEditAddressForm({
                name: "",
                phone: "",
                address: "",
                provinceId: null,
                districtId: null,
                wardCode: null,
            });
            setEditAddressErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
            setEditingAddressId(null);
            setDeliverToOther(false); // Đảm bảo checkbox không bị check
        } catch (error) {
            console.error("Lỗi khi cập nhật địa chỉ:", error);
            message.error("Cập nhật địa chỉ thất bại: " + (error.response?.data?.message || error.message || "Lỗi không xác định"));
        } finally {
            setAddressLoading(false);
        }
    };

    const validatePhone = (phone) => {
        const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    const validateName = (name) => {
        return name.trim().length >= 2 && name.trim().length <= 50;
    };

    const validateAddress = (address) => {
        return address.trim().length >= 10 && address.trim().length <= 200;
    };

    const validateNewAddressForm = () => {
        const errors = {
            name: '',
            phone: '',
            address: '',
            provinceId: '',
            districtId: '',
            wardCode: ''
        };
        let isValid = true;

        const name = newAddressForm.name?.trim() || '';
        if (!name) {
            errors.name = 'Họ và tên không được để trống';
            isValid = false;
        } else if (name.length < 2 || name.length > 50) {
            errors.name = 'Họ và tên phải có độ dài từ 2 đến 50 ký tự';
            isValid = false;
        } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(name)) {
            errors.name = 'Họ và tên chỉ được chứa chữ cái, dấu tiếng Việt và khoảng trắng';
            isValid = false;
        }

        // Validate số điện thoại
        const phone = newAddressForm.phone?.trim() || '';
        if (!phone) {
            errors.phone = 'Số điện thoại không được để trống';
            isValid = false;
        } else if (!/^\d+$/.test(phone)) {
            errors.phone = 'Số điện thoại chỉ được chứa số';
            isValid = false;
        } else if (phone.length !== 10) {
            errors.phone = 'Số điện thoại phải có đúng 10 số';
            isValid = false;
        } else if (!/^(03|05|07|08|09)/.test(phone)) {
            errors.phone = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09';
            isValid = false;
        }

        const address = newAddressForm.address?.trim() || '';
        if (!address) {
            errors.address = 'Địa chỉ chi tiết không được để trống';
            isValid = false;
        } else if (address.length < 5) {
            errors.address = 'Địa chỉ chi tiết phải có ít nhất 5 ký tự';
            isValid = false;
        }

        if (!newAddressForm.provinceId) {
            errors.provinceId = 'Vui lòng chọn tỉnh/thành phố';
            isValid = false;
        }

        if (!newAddressForm.districtId) {
            errors.districtId = 'Vui lòng chọn quận/huyện';
            isValid = false;
        }

        if (!newAddressForm.wardCode) {
            errors.wardCode = 'Vui lòng chọn phường/xã';
            isValid = false;
        }

        setNewAddressErrors(errors);
        return isValid;
    };

    const validateEditAddressForm = () => {
        const errors = {
            name: '',
            phone: '',
            address: '',
            provinceId: '',
            districtId: '',
            wardCode: ''
        };
        let isValid = true;

        const name = editAddressForm.name?.trim() || '';
        if (!name) {
            errors.name = 'Họ và tên không được để trống';
            isValid = false;
        } else if (name.length < 2 || name.length > 50) {
            errors.name = 'Họ và tên phải có độ dài từ 2 đến 50 ký tự';
            isValid = false;
        } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(name)) {
            errors.name = 'Họ và tên chỉ được chứa chữ cái, dấu tiếng Việt và khoảng trắng';
            isValid = false;
        }

        const phone = editAddressForm.phone?.trim() || '';
        if (!phone) {
            errors.phone = 'Số điện thoại không được để trống';
            isValid = false;
        } else if (!/^\d+$/.test(phone)) {
            errors.phone = 'Số điện thoại chỉ được chứa số';
            isValid = false;
        } else if (phone.length !== 10) {
            errors.phone = 'Số điện thoại phải có đúng 10 số';
            isValid = false;
        } else if (!/^(03|05|07|08|09)/.test(phone)) {
            errors.phone = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09';
            isValid = false;
        }

        const address = editAddressForm.address?.trim() || '';
        if (!address) {
            errors.address = 'Địa chỉ chi tiết không được để trống';
            isValid = false;
        } else if (address.length < 5) {
            errors.address = 'Địa chỉ chi tiết phải có ít nhất 5 ký tự';
            isValid = false;
        }

        if (!editAddressForm.provinceId) {
            errors.provinceId = 'Vui lòng chọn tỉnh/thành phố';
            isValid = false;
        }

        if (!editAddressForm.districtId) {
            errors.districtId = 'Vui lòng chọn quận/huyện';
            isValid = false;
        }

        if (!editAddressForm.wardCode) {
            errors.wardCode = 'Vui lòng chọn phường/xã';
            isValid = false;
        }

        setEditAddressErrors(errors);
        return isValid;
    };

    const handleAddNewAddress = async () => {
        // Validate form trước khi gửi
        if (!validateNewAddressForm()) {
            message.error('Vui lòng kiểm tra lại thông tin đã nhập');
            return;
        }

        // Confirm dialog
        Modal.confirm({
            title: 'Xác nhận thêm địa chỉ',
            content: 'Bạn có chắc chắn muốn thêm địa chỉ mới này không?',
            okText: 'Xác nhận',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setAddressLoading(true);
                    
                    const addressData = {
                        hoTen: newAddressForm.name.trim(),
                        soDienThoai: newAddressForm.phone.trim(),
                        diaChiChiTiet: newAddressForm.address.trim(),
                        tinhThanh: newAddressForm.provinceId,
                        quanHuyen: newAddressForm.districtId,
                        phuongXa: newAddressForm.wardCode,
                        idTaiKhoan: localStorage.getItem("isUser")
                    };

                    console.log("💾 Dữ liệu địa chỉ sẽ gửi lên:", addressData);

                    const response = await addAddress(addressData);
                    console.log("Thêm địa chỉ thành công:", response);

                    message.success("Thêm địa chỉ thành công!");

                    const customerId = localStorage.getItem("isUser");
                    const updated = await getAllAddress(customerId);
                    const raw = Array.isArray(updated) ? updated : updated?.data || [];
                    
                    if (!raw || raw.length === 0) {
                        console.warn("⚠️ Không có địa chỉ nào được trả về");
                        setAddresses([]);
                    } else {
                        const mappedPromises = raw.map(async (a) => {
                            const id = a.id || a.idDiaChi || a.idAddress;
                            const name = a.name || a.ten || a.hoTen || "";
                            const phone = a.phone || a.soDienThoai || "";
                            const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";
                            const { provinceId, districtId, wardCode } = extractAddressIds(a);
                            const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh || false);

                            // Load tên từ ID
                            let province = a.province || a.tinhThanhPho || a.tinh_thanh || "";
                            let district = a.district || a.quan_huyen || "";
                            let ward = a.ward || a.phuong_xa || "";

                            if (provinceId || districtId || wardCode) {
                                const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
                                if (names.provinceName) province = names.provinceName;
                                if (names.districtName) district = names.districtName;
                                if (names.wardName) ward = names.wardName;
                            }

                            return {
                                ...a,
                                id,
                                name,
                                phone,
                                address: addressText,
                                province,
                                district,
                                ward,
                                provinceId,
                                districtId,
                                wardCode,
                                isDefault
                            };
                        });
                        const mapped = await Promise.all(mappedPromises);
                        
                        const newAddressId = response?.id || response?.data?.id || response?.data?.idDiaChi || response?.data?.idAddress;
                        const sorted = mapped.sort((a, b) => {
                            const aId = String(a.id || '');
                            const bId = String(b.id || '');
                            const newId = String(newAddressId || '');
                            const aIsNew = aId === newId || (
                                String(a.provinceId) === String(newAddressForm.provinceId) &&
                                String(a.districtId) === String(newAddressForm.districtId) &&
                                String(a.wardCode) === String(newAddressForm.wardCode) &&
                                a.name.trim() === newAddressForm.name.trim() &&
                                a.phone.trim() === newAddressForm.phone.trim() &&
                                a.address.trim() === newAddressForm.address.trim()
                            );
                            const bIsNew = bId === newId || (
                                String(b.provinceId) === String(newAddressForm.provinceId) &&
                                String(b.districtId) === String(newAddressForm.districtId) &&
                                String(b.wardCode) === String(newAddressForm.wardCode) &&
                                b.name.trim() === newAddressForm.name.trim() &&
                                b.phone.trim() === newAddressForm.phone.trim() &&
                                b.address.trim() === newAddressForm.address.trim()
                            );
                            
                            if (a.isDefault && !b.isDefault) return -1;
                            if (!a.isDefault && b.isDefault) return 1;
                            
                            if (aIsNew && !bIsNew) return -1;
                            if (!aIsNew && bIsNew) return 1;
                            
                            return 0;
                        });
                        
                        setAddresses(sorted);
                    }

                    setNewAddressForm({
                        name: "",
                        phone: "",
                        address: "",
                        provinceId: null,
                        districtId: null,
                        wardCode: null,
                    });
                    setNewAddressErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
                    setShowAddAddressForm(false); // Đóng form thêm, quay lại danh sách địa chỉ
                    setDeliverToOther(false); // Đảm bảo checkbox không bị check

                    setDistricts([]);
                    setWards([]);

                } catch (error) {
                    console.error("Lỗi khi thêm địa chỉ:", error);
                    message.error("Thêm địa chỉ thất bại: " + (error.response?.data?.message || error.message || "Lỗi không xác định"));
                } finally {
                    setAddressLoading(false);
                }
            }
        });
    };

    const handleCheckout = () => {
        if (selectedProducts.size === 0) {
            message.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
            return;
        }
        setCurrentStep(1);
        window.scrollTo(0, 0);
    };

    const handleBack = () => {
        sessionStorage.removeItem("buyNow");
        setIsBuyNow(false);
        setCurrentStep(0);
        window.scrollTo(0, 0);
    };

    const handleToggleProduct = async (productId) => {
        if (!productId) {
            console.warn('Invalid product ID:', productId);
            return;
        }
        
        const normalizedId = String(productId).trim();
        if (!normalizedId || normalizedId === 'undefined' || normalizedId === 'null' || normalizedId === '') {
            console.warn('Invalid normalized product ID:', normalizedId, 'from:', productId);
            return;
        }
        
        let wasSelected = false;
        setSelectedProducts(prev => {
            wasSelected = prev.has(normalizedId);
            return prev; // Không thay đổi, chỉ để lấy giá trị
        });
        
        console.log('🔵 wasSelected:', wasSelected);
        
        // Khi uncheck, chỉ bỏ chọn, không xóa sản phẩm khỏi giỏ hàng
        
        setSelectedProducts(prev => {
            const newSet = new Set(prev);
            console.log('🔵 Current selectedProducts:', Array.from(newSet));
            
            if (newSet.has(normalizedId)) {
                newSet.delete(normalizedId);
                console.log('🔵 Removed:', normalizedId, 'New set:', Array.from(newSet));
                return newSet;
            } else {
                const currentTotal = orderProduct
                    .filter((item, index) => {
                        const itemId = String(item.idSpct || item.id || `temp-${index}`);
                        return newSet.has(itemId);
                    })
                    .reduce((sum, item) => sum + item.price, 0);
                
                const productToAdd = orderProduct.find((item, index) => {
                    const itemId = String(item.idSpct || item.id || `temp-${index}`);
                    return itemId === normalizedId;
                });
                
                if (productToAdd) {
                    const newTotal = currentTotal + productToAdd.price;
                    const maxAmount = 100000000; // 100 triệu
                    
                    if (newTotal > maxAmount) {
                        message.warning({
                            content: `Tổng tiền đơn hàng không được vượt quá 100 triệu đồng. Vui lòng chọn sản phẩm khác hoặc bỏ bớt sản phẩm đã chọn.`,
                            duration: 5
                        });
                        return prev; // Không thay đổi, giữ nguyên trạng thái cũ
                    }
                }
                
                newSet.add(normalizedId);
                console.log('🔵 Added:', normalizedId, 'New set:', Array.from(newSet));
                return newSet;
            }
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const totalIfSelectAll = orderProduct.reduce((sum, item) => sum + item.price, 0);
            const maxAmount = 100000000; // 100 triệu
            
            if (totalIfSelectAll > maxAmount) {
                message.warning({
                    content: `Tổng tiền đơn hàng không được vượt quá 100 triệu đồng. Vui lòng chọn một số sản phẩm phù hợp.`,
                    duration: 5
                });
                return; // Không cho chọn tất cả
            }
            
            const allIds = new Set();
            orderProduct.forEach((item, index) => {
                let itemId = null;
                if (item.idSpct) {
                    itemId = String(item.idSpct);
                } else if (item.id) {
                    itemId = String(item.id);
                } else {
                    itemId = `temp-${index}`;
                }
                if (itemId && itemId !== 'undefined' && itemId !== 'null' && itemId.trim() !== '') {
                    allIds.add(itemId);
                }
            });
            console.log('Select all - IDs:', Array.from(allIds));
            setSelectedProducts(allIds);
        } else {
            setSelectedProducts(new Set());
        }
    };

    const getPaymentMethodId = (paymentMethod) => {
        const paymentMethodMap = {
            "delivery": "EAA501DF-EED2-412F-B065-55F0DD65CCEA", // Thanh toán khi nhận hàng
            "vnpay": "CEA41D72-5960-4888-B256-08DA2AACB456" // Thanh toán VNPAY
        };
        return paymentMethodMap[paymentMethod] || paymentMethodMap["delivery"];
    };

    const buildDiaChiDayDu = (diaChiChiTiet, ward, district, province) => {
        const parts = [];
        
        // Địa chỉ chi tiết
        if (diaChiChiTiet && diaChiChiTiet.trim()) {
            parts.push(diaChiChiTiet.trim());
        }
        
        // Xã/Phường
        if (ward && ward.trim()) {
            parts.push(ward.trim());
        }
        
        // Quận/Huyện
        if (district && district.trim()) {
            parts.push(district.trim());
        }
        
        // Tỉnh/Thành phố
        if (province && province.trim()) {
            parts.push(province.trim());
        }
        
        parts.push("Việt Nam");
        
        return parts.join(", ");
    };

    const handleConfirmOrder = async () => {
        if (selectedProducts.size === 0) {
            message.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán!');
            return;
        }
        
        // Validate giỏ hàng
        if (orderProduct.length === 0) {
            message.warning('Giỏ hàng trống!');
            return;
        }

        let customerName = "";
        let customerPhone = "";
        let addressId = null;
        let diaChiDayDu = "";

        if (deliverToOther) {
            if (!formData.fullName || !formData.phone) {
                message.warning('Vui lòng điền đầy đủ thông tin người nhận!');
                return;
            }
            if (!formData.address) {
                message.warning('Vui lòng nhập địa chỉ giao hàng!');
                return;
            }
            customerName = formData.fullName;
            customerPhone = formData.phone;
            addressId = null;
            
            let wardName = "";
            let districtName = "";
            let provinceName = "";
            
            if (formData.provinceId || formData.districtId || formData.wardCode) {
                const addressNames = await loadAddressNamesFromIds(
                    formData.provinceId,
                    formData.districtId,
                    formData.wardCode
                );
                wardName = addressNames.wardName || "";
                districtName = addressNames.districtName || "";
                provinceName = addressNames.provinceName || "";
            }
            
            // Tạo diaChiDayDu từ formData
            diaChiDayDu = buildDiaChiDayDu(
                formData.address,
                wardName,
                districtName,
                provinceName
            );
        } else {
            if (!selectedAddressId) {
                message.warning('Vui lòng chọn địa chỉ giao hàng!');
                return;
            }

            const selectedAddr = addresses.find(addr => 
                (addr.id || addr.idDiaChi || addr.idAddress) === selectedAddressId
            );

            if (!selectedAddr) {
                message.warning('Không tìm thấy địa chỉ đã chọn!');
                return;
            }

            customerName = selectedAddr.name || selectedAddr.hoTen || selectedAddr.ten || "";
            customerPhone = selectedAddr.phone || selectedAddr.soDienThoai || "";
            addressId = selectedAddressId;

            if (!customerName || !customerPhone) {
                message.warning('Thông tin địa chỉ không đầy đủ!');
                return;
            }
            
            const { provinceId, districtId, wardCode } = extractAddressIds(selectedAddr);
            
            console.log("🔍 Địa chỉ đã chọn (trước khi load tên):", {
                selectedAddr,
                extractedIds: { provinceId, districtId, wardCode },
                rawFields: {
                    tinhThanh: selectedAddr.tinhThanh,
                    quanHuyen: selectedAddr.quanHuyen,
                    phuongXa: selectedAddr.phuongXa
                }
            });
            
            let wardName = "";
            let districtName = "";
            let provinceName = "";
            
            if (provinceId || districtId || wardCode) {
                console.log("🔄 Đang load tên từ ID...");
                const addressNames = await loadAddressNamesFromIds(
                    provinceId,
                    districtId,
                    wardCode
                );
                wardName = addressNames.wardName || "";
                districtName = addressNames.districtName || "";
                provinceName = addressNames.provinceName || "";
                
                console.log("✅ Đã load tên từ ID:", {
                    wardName,
                    districtName,
                    provinceName,
                    fromIds: { provinceId, districtId, wardCode }
                });
                
                // Nếu vẫn không có tên sau khi load, cảnh báo
                if (!wardName && !districtName && !provinceName) {
                    console.error("❌ Không load được tên từ ID, có thể ID không hợp lệ:", {
                        provinceId,
                        districtId,
                        wardCode
                    });
                }
            } else {
                console.warn("⚠️ Không tìm thấy ID để load tên, dùng fallback từ selectedAddr");
                wardName = selectedAddr.ward || selectedAddr.wardName || "";
                districtName = selectedAddr.district || selectedAddr.districtName || "";
                provinceName = selectedAddr.province || selectedAddr.provinceName || "";
                console.warn("⚠️ Fallback tên từ selectedAddr:", {
                    wardName,
                    districtName,
                    provinceName
                });
            }
            
            if ((!wardName || !districtName || !provinceName) && (provinceId || districtId || wardCode)) {
                console.error("❌ CẢNH BÁO: Không load được đầy đủ tên từ ID!", {
                    provinceId,
                    districtId,
                    wardCode,
                    loadedNames: { wardName, districtName, provinceName }
                });
            }
            
            diaChiDayDu = buildDiaChiDayDu(
                selectedAddr.address || selectedAddr.diaChiChiTiet || "",
                wardName, // Chỉ dùng tên đã load, không dùng selectedAddr.ward
                districtName, // Chỉ dùng tên đã load, không dùng selectedAddr.district
                provinceName // Chỉ dùng tên đã load, không dùng selectedAddr.province
            );
            
            // VALIDATION: Kiểm tra xem diaChiDayDu có chứa ID (số 3-4 chữ số) không
            const containsIdPattern = /\b\d{3,4}\b/.test(diaChiDayDu);
            if (containsIdPattern) {
                console.error("❌ CẢNH BÁO: diaChiDayDu có thể chứa ID thay vì tên!", {
                    diaChiDayDu,
                    extractedIds: { provinceId, districtId, wardCode },
                    loadedNames: { wardName, districtName, provinceName }
                });
            }
            
            console.log("📦 diaChiDayDu đã tạo (FINAL):", diaChiDayDu);
            console.log("📦 Validation diaChiDayDu:", {
                containsIdPattern,
                hasWardName: !!wardName,
                hasDistrictName: !!districtName,
                hasProvinceName: !!provinceName,
                diaChiDayDu
            });
        }

        try {
            // Hiển thị loading
            message.loading({ content: 'Đang tạo đơn hàng...', key: 'creatingOrder', duration: 0 });

            // Tính phí ship thực tế (có thể free ship nếu >= 5tr)
            const totalAfterDiscount = totalAmount - appliedDiscount;
            const actualShippingFee = totalAfterDiscount >= 5000000 ? 0 : shippingFee;

            // Lấy voucher ID từ selectedDiscount
            let voucherId = null;
            if (selectedDiscount) {
                console.log("🎫 selectedDiscount object:", selectedDiscount);
                voucherId = selectedDiscount.idPhieuGiamGia || selectedDiscount.id || null;
                console.log("🎫 Voucher ID sẽ gửi:", voucherId);
            }

            const orderData = {
                idTaiKhoan: localStorage.getItem("isUser"),
                ...(addressId && { idDiaChi: addressId }), // Chỉ gửi idDiaChi nếu có (khi chọn từ list)
                diaChiDayDu: diaChiDayDu, // Địa chỉ đầy đủ theo format yêu cầu
                tenKhachHang: customerName,
                sdtKhachHang: customerPhone,
                loaiDon: "Đơn hàng online",
                phiVanChuyen: actualShippingFee,
                phiDichVuKhac: 0, // Có thể cập nhật nếu có
                ghiChu: formData.note || "", // Ghi chú đơn hàng
                isVnPay: formData.paymentMethod === "vnpay", // true nếu VNPay, false nếu thanh toán khi nhận hàng
                ...(voucherId ? { idPhieuGiamGia: voucherId } : {}), // Gửi voucher ID nếu có
                listOrderCT: orderProduct
                    .filter((item, index) => {
                        const itemId = String(item.idSpct || item.id || `temp-${index}`);
                        return selectedProducts.has(itemId);
                    })
                    .map(item => ({
                        idLaptopChiTiet: item.idSpct || item.id || item.idChiTiet, // ID chi tiết laptop
                        giaBan: item.price
                    })),
                listHinhThucThanhToan: [{
                    idHinhThucThanhToan: getPaymentMethodId(formData.paymentMethod),
                    soTien: finalTotal, // Tổng tiền cần thanh toán
                    ghiChu: formData.paymentMethod === "delivery" 
                        ? "Thanh toán khi nhận hàng" 
                        : "Thanh toán online VNPAY"
                }]
            };

            console.log("📦 Dữ liệu đơn hàng sẽ gửi:", orderData);
            console.log("🎫 Voucher ID trong orderData:", orderData.idPhieuGiamGia);
            console.log("🎫 selectedDiscount:", selectedDiscount);

            const orderDataForDebug = {
                ...orderData,
                timestamp: new Date().toISOString(),
                paymentMethod: formData.paymentMethod,
                diaChiDayDu: diaChiDayDu, // Đảm bảo lưu diaChiDayDu để kiểm tra
                debugInfo: {
                    selectedAddressId: addressId,
                    deliverToOther: deliverToOther,
                    customerName: customerName,
                    customerPhone: customerPhone
                }
            };
            localStorage.setItem("lastOrderData", JSON.stringify(orderDataForDebug));
            console.log("💾 Đã lưu orderData vào localStorage (key: lastOrderData):", orderDataForDebug);

            if (formData.paymentMethod === "vnpay") {
                setIsVNPayProcessing(true);

                try {
                    const vnpayOrderData = {
                        ...orderData,
                        ghiChu: (orderData.ghiChu || "") + "",
                        // Thêm các field để backend biết không gửi email (backend cần xử lý các field này):
                        skipEmail: true,
                        sendEmail: false,
                        isVNPayPending: true,
                    };

                    const vnpayOrderDataForDebug = {
                        ...vnpayOrderData,
                        timestamp: new Date().toISOString(),
                        paymentMethod: "vnpay",
                        note: "Dữ liệu gửi lên backend cho VNPay (có skipEmail flags)"
                    };
                    localStorage.setItem("lastVNPayOrderData", JSON.stringify(vnpayOrderDataForDebug));
                    console.log("💾 Đã lưu vnpayOrderData vào localStorage (key: lastVNPayOrderData):", vnpayOrderDataForDebug);

                    const response = await createOrder(vnpayOrderData);
                    console.log("✅ Tạo đơn hàng thành công (chờ thanh toán VNPay):", response);

                    const idOrder = response?.data?.id || response?.id || response?.idOrder;
                    
                    if (!idOrder) {
                        throw new Error("Không nhận được ID đơn hàng từ server");
                    }

                    sessionStorage.setItem("vnpayOrderId", idOrder);
                    sessionStorage.setItem("pendingOrderSelectedProducts", JSON.stringify(Array.from(selectedProducts)));
                    sessionStorage.setItem("pendingOrderProductList", JSON.stringify(orderProduct));

                    // Chuẩn bị dữ liệu thanh toán VNPay với idOrder thực
                    const paymentData = {
                        idOrder: idOrder,
                        amount: finalTotal,
                        orderInfo: `Thanh toan don hang ${idOrder}`,
                        orderType: "other",
                        bankCode: ""
                    };

                    console.log("💳 Dữ liệu thanh toán VNPay:", paymentData);

                    // Gọi API tạo payment URL
                    const paymentResponse = await createVNPayPayment(paymentData);
                    console.log("✅ Tạo URL thanh toán VNPay thành công:", paymentResponse);

                    const paymentUrl = paymentResponse?.data?.paymentUrl || paymentResponse?.paymentUrl;
                    
                    if (paymentUrl) {
                        // Chuyển hướng đến trang thanh toán VNPay
                        window.location.href = paymentUrl;
                    } else {
                        // Nếu lỗi, xóa dữ liệu đã lưu
                        sessionStorage.removeItem("vnpayOrderId");
                        sessionStorage.removeItem("pendingOrderSelectedProducts");
                        sessionStorage.removeItem("pendingOrderProductList");
                        setIsVNPayProcessing(false);
                        throw new Error("Không nhận được URL thanh toán từ VNPay");
                    }
                } catch (error) {
                    setIsVNPayProcessing(false);
                    throw error;
                }
            } else {
                setIsDeliveryProcessing(true);
                
                try {
                    const deliveryOrderDataForDebug = {
                        ...orderData,
                        timestamp: new Date().toISOString(),
                        paymentMethod: "delivery",
                        note: "Dữ liệu gửi lên backend cho thanh toán khi nhận hàng"
                    };
                    localStorage.setItem("lastDeliveryOrderData", JSON.stringify(deliveryOrderDataForDebug));

                    const response = await createOrder(orderData);
                console.log("✅ Tạo đơn hàng thành công:", response);
                message.success({ 
                    content: 'Đặt hàng thành công!', 
                    key: 'creatingOrder',
                    duration: 3
                });

                const remainingProducts = orderProduct.filter(
                    (item, index) => {
                        const itemId = String(item.idSpct || item.id || `temp-${index}`);
                        return !selectedProducts.has(itemId);
                    }
                );
                setOrderProduct(remainingProducts);
                
                if (!isCustomer) {
                    if (remainingProducts.length > 0) {
                        localStorage.setItem("orderProduct", JSON.stringify(remainingProducts));
                    } else {
                        localStorage.removeItem("orderProduct");
                    }
                }
                
                setSelectedProducts(new Set());
                
                sessionStorage.removeItem("buyNow");
                setIsBuyNow(false);
                    setCurrentStep(2);
                    window.scrollTo(0, 0);
                } finally {
                    setIsDeliveryProcessing(false);
                }
            }

        } catch (error) {
            console.error("❌ Lỗi khi tạo đơn hàng:", error);
            setIsVNPayProcessing(false);
            setIsDeliveryProcessing(false);
            message.error({ 
                content: error.response?.data?.message || 'Tạo đơn hàng thất bại. Vui lòng thử lại!', 
                key: 'creatingOrder',
                duration: 5
            });
        }
    };

    const subtotal = orderProduct
        .filter((item, index) => {
            const itemId = String(item.idSpct || item.id || `temp-${index}`);
            return selectedProducts.has(itemId);
        })
        .reduce((sum, item) => sum + item.price, 0);

    const total = subtotal - appliedDiscount;

    const formatPrice = (price) => {
        return Intl.NumberFormat('vi-VN').format(price) + ' ₫';
    };
    function normalizeCartData(data) {
        return data.map((item, index) => {
            if (item.productInfo) {
                const normalized = {
                    id: item.idChiTiet,
                    idSpct: item.idSpct,
                    idGiohang: item.idChiTiet, // idChiTiet chính là idGioHangCT để xóa
                    name: item.productInfo.name,
                    cpu: item.productInfo.cpu,
                    card: item.productInfo.card,
                    ram: item.productInfo.ram,
                    ssd: item.productInfo.ssd,
                    color: item.productInfo.color,
                    image: item.productInfo.image,
                    price: item.productInfo.price,
                };
                if (index === 0) {
                    console.log("🔍 Normalize item[0] - Original:", item);
                    console.log("🔍 Normalize item[0] - Normalized:", normalized);
                    console.log("🔍 item.idChiTiet (idGioHangCT):", item.idChiTiet);
                }
                return normalized;
            } else {
                // trường hợp từ localStorage (khách chưa đăng nhập)
                return {
                    id: item.id,
                    idSpct: item.idSpct,
                    name: item.name,
                    cpu: item.cpu,
                    card: item.card,
                    ram: item.ram,
                    ssd: item.ssd,
                    color: item.color,
                    image: item.image,
                    price: item.price,
                };
            }
        });
    }

    const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0];
    
    // Địa chỉ đã chọn (ưu tiên selectedAddressId, nếu không có thì dùng defaultAddress)
    const selectedAddress = selectedAddressId 
        ? addresses.find(addr => (addr.id || addr.idDiaChi) === selectedAddressId)
        : defaultAddress;

    useEffect(() => {
        if (defaultAddress && !selectedAddressId && !deliverToOther && currentStep === 1) {
            const id = defaultAddress.id || defaultAddress.idDiaChi || defaultAddress.idAddress;
            setSelectedAddressId(id);
        }
    }, [defaultAddress, currentStep, deliverToOther]);

    useEffect(() => {
        if (selectedAddress && selectedAddress.districtId && selectedAddress.wardCode && !deliverToOther && currentStep === 1) {
            // Chỉ set formData nếu chưa có giá trị
            if (!formData.districtId || !formData.wardCode) {
                setFormData(prev => ({
                    ...prev,
                    provinceId: selectedAddress.provinceId,
                    districtId: selectedAddress.districtId,
                    wardCode: selectedAddress.wardCode,
                }));
            }
        }
    }, [selectedAddress, deliverToOther, currentStep]);


    useEffect(() => {
        if (formData.districtId && formData.wardCode && orderProduct.length > 0 && currentStep === 1) {
            calculateShippingFee(formData.districtId, formData.wardCode);
            fetchDayShip(formData.districtId, formData.wardCode);
        }
    }, [orderProduct, formData.districtId, formData.wardCode, currentStep]);

    return (
        <div className="cart-page">
          
            {currentStep === 1 && (
                <button onClick={handleBack} className="back-btn">
                    <ArrowLeftOutlined /> Quay lại
                </button>
            )}

            {/* Tiêu đề */}
            <div className="cart-header">
                <h1 className="cart-title">
                    {currentStep === 0 ? 'Giỏ hàng' : currentStep === 1 ? 'Thông tin đặt hàng' : 'Hoàn tất đặt hàng'}
                </h1>
            </div>

            {/* Stepper */}
            <div className="cart-stepper">
                <div className={`step-item ${currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : ''}`}>
                    <div className={`step-circle ${currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : ''}`}>
                        <ShoppingCartOutlined className="step-icon" />
                    </div>
                    <div className="step-label">Chọn sản phẩm</div>
                </div>

                <div className={`step-connector ${currentStep >= 1 ? 'active' : ''}`}></div>

                <div className={`step-item ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                    <div className={`step-circle ${currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : ''}`}>
                        <CreditCardOutlined className="step-icon" />
                    </div>
                    <div className="step-label">Thông tin đặt hàng</div>
                </div>

                <div className={`step-connector ${currentStep >= 2 ? 'active' : ''}`}></div>

                <div className={`step-item ${currentStep === 2 ? 'active' : ''}`}>
                    <div className={`step-circle ${currentStep === 2 ? 'active' : ''}`}>
                        <CheckCircleOutlined className="step-icon" />
                    </div>
                    <div className="step-label">Hoàn tất đặt hàng</div>
                </div>
            </div>

            {currentStep === 0 && (
                <>
                    {orderProduct.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingCartOutlined className="empty-cart-icon" />
                            <h2 className="empty-cart-title">Giỏ hàng trống</h2>
                            <p className="empty-cart-message">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                        </div>
                    ) : (
                        <div className="cart-content">
                            <div className="cart-items-card">
                                {/* Checkbox chọn tất cả */}
                                <div className="select-all-section">
                                    {(() => {
                                        // Tính tổng tiền nếu chọn tất cả
                                        const totalIfSelectAll = orderProduct.reduce((sum, item) => sum + item.price, 0);
                                        const maxAmount = 100000000; // 100 triệu
                                        const isSelectAllDisabled = totalIfSelectAll > maxAmount;
                                        
                                        return (
                                            <Checkbox
                                                checked={selectedProducts.size > 0 && selectedProducts.size === orderProduct.length}
                                                indeterminate={selectedProducts.size > 0 && selectedProducts.size < orderProduct.length}
                                                onChange={(e) => handleSelectAll(e.target.checked)}
                                                disabled={isSelectAllDisabled}
                                            >
                                                <span style={{ fontWeight: '600', fontSize: '15px' }}>
                                                    Chọn tất cả ({selectedProducts.size}/{orderProduct.length})
                                                    {isSelectAllDisabled && (
                                                        <span style={{ color: '#ff4d4f', fontSize: '12px', marginLeft: '8px' }}>
                                                            (Tổng tiền vượt quá 100 triệu)
                                                        </span>
                                                    )}
                                                </span>
                                            </Checkbox>
                                        );
                                    })()}
                                </div>

                                {orderProduct.map((item, index) => {
                                    // Đảm bảo luôn có ID hợp lệ, normalize thành string để so sánh đúng
                                    const getItemId = () => {
                                        if (item.idSpct) return String(item.idSpct);
                                        if (item.id) return String(item.id);
                                        return `temp-${index}`;
                                    };
                                    const itemId = getItemId();
                                    const isSelected = selectedProducts.has(itemId);
                                    
                                    // Tính tổng tiền hiện tại của các sản phẩm đã chọn
                                    const currentTotal = orderProduct
                                        .filter((prod, idx) => {
                                            const prodId = String(prod.idSpct || prod.id || `temp-${idx}`);
                                            return selectedProducts.has(prodId);
                                        })
                                        .reduce((sum, prod) => sum + prod.price, 0);
                                    
                                    const maxAmount = 100000000; // 100 triệu
                                    // Disable checkbox nếu tổng tiền đã >= 100tr và sản phẩm này chưa được chọn
                                    const isDisabled = !isSelected && currentTotal >= maxAmount;
                                    
                                    console.log(`Item ${index}:`, { 
                                        idSpct: item.idSpct, 
                                        id: item.id, 
                                        itemId, 
                                        isSelected,
                                        currentTotal,
                                        isDisabled,
                                        selectedProducts: Array.from(selectedProducts)
                                    });
                                    
                                    return (
                                        <div key={item.id || item.idSpct || `item-${index}`} className={`cart-item ${isSelected ? 'selected' : ''}`}>
                                            <Checkbox
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    const productId = getItemId();
                                                    console.log('Toggle product:', productId);
                                                    handleToggleProduct(productId);
                                                }}
                                                className="product-checkbox"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            
                                            <img
                                                src={item.image || item.anhDaiDien || "https://1pro.vn/wp-content/uploads/2025/01/Pro-1422-M1-silver-600x500.png"}
                                                alt={item.name}
                                                className="cart-item-image"
                                            />

                                            <div className="cart-item-info">
                                                <h3 className="cart-item-name">
                                                    {`${item.name} ${item.cpu || ''} ${item.card || ''} ${item.ram || item.memory || ''} ${item.ssd || ''}`}
                                                </h3>
                                                {item.color && (
                                                    <p className="cart-item-color">Màu sắc: {item.color}</p>
                                                )}
                                                <p className="cart-item-price">
                                                    {formatPrice(item.price)}
                                                </p>
                                            </div>

                                            <div className="cart-item-actions">
                                                <div className="item-total">
                                                    <div className="item-total-label">Giá</div>
                                                    <div className="item-total-price">
                                                        {formatPrice(item.price)}
                                                    </div>
                                                </div>

                                                <DeleteOutlined
                                                    onClick={() => deleteCartItem(item.id)}
                                                    className="delete-btn"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="order-summary-card">
                                <h3 className="summary-title">Tóm tắt đơn hàng</h3>

                                <div className="summary-row">
                                    <span className="summary-label">Tổng tiền tạm tính</span>
                                    <span className="summary-value">{formatPrice(subtotal)}</span>
                                </div>

                                {/* Chỉ hiển thị voucher ở step 0 khi KHÔNG phải mua ngay (đã chọn voucher ở giỏ hàng) */}
                                {(() => {
                                    // Chỉ hiển thị voucher ở step 0 khi KHÔNG phải mua ngay
                                    if (!isBuyNow) {
                                        return (
                                            <div className="voucher-section" style={{ position: 'relative' }} ref={dropdownRef}>
                                                <div className="voucher-input-group">
                                                    <input
                                                        type="text"
                                                        placeholder="Nhập hoặc chọn mã giảm giá"
                                                        value={discountCode}
                                                        onChange={(e) => setDiscountCode(e.target.value)}
                                                        onFocus={() => setShowDropdown(true)}
                                                        className="voucher-input"
                                                    />
                                                    <button
                                                        onClick={() => message.info("Mã giảm giá đã được áp dụng!")}
                                                        className="voucher-btn"
                                                    >
                                                        Áp dụng
                                                    </button>
                                                </div>

                                                {showDropdown && (
                                                    <div className="voucher-dropdown">
                                                        {discounts.length === 0 ? (
                                                            <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
                                                                Không có mã giảm giá khả dụng
                                                            </div>
                                                        ) : (
                                                            discounts.map((voucher) => (
                                                                <div
                                                                    key={voucher.maGiamGia}
                                                                    onClick={() => applyDiscount(voucher)}
                                                                    className={`voucher-item ${selectedDiscount?.maGiamGia === voucher.maGiamGia ? 'selected' : ''}`}
                                                                >
                                                                    <div className="voucher-code">
                                                                        {voucher.ten} ({voucher.maGiamGia})
                                                                    </div>
                                                                    <div className="voucher-desc">
                                                                        Giảm: {voucher.giaTriGiam < 100.00
                                                                            ? `${voucher.giaTriGiam}%${voucher.giaTriMax ? ` (tối đa ${voucher.giaTriMax.toLocaleString('vi-VN')} ₫)` : ''}`
                                                                            : `${voucher.giaTriGiam.toLocaleString('vi-VN')} ₫`}
                                                                    </div>
                                                                    {voucher.giaTriGiam < 100.00 && voucher.giaTriMin && (
                                                                        <div className="voucher-min">
                                                                            Đơn tối thiểu: {voucher.giaTriMin.toLocaleString('vi-VN')} ₫
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {appliedDiscount > 0 && (
                                    <div className="summary-row">
                                        <span className="summary-label">Giảm giá</span>
                                        <span className="summary-value discount">-{formatPrice(appliedDiscount)}</span>
                                    </div>
                                )}

                                <div className="summary-divider"></div>

                                <div className="total-row">
                                    <span className="total-label">Tổng tiền thanh toán</span>
                                    <span className="total-value">{formatPrice(finalTotal)}</span>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    className="checkout-btn"
                                    disabled={orderProduct.length === 0}
                                >
                                    Tiến hành đặt hàng
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
            {/* BƯỚC 2: THÔNG TIN ĐẶT HÀNG */}
            {currentStep === 1 && (
                <div className="checkout-form-card">
                    <div className="form-section">
                        <h2 className="form-section-title">Địa chỉ giao hàng</h2>

                        {/* Hiển thị địa chỉ đã chọn của khách khi KHÔNG giao cho người khác */}
                        {!deliverToOther && selectedAddress && (
                            <div className="current-address-card" style={{
                                background: '#f8f9fa',
                                border: '1px solid #e0e0e0',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                            }}>
                                <div className="address-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                    <div style={{
                                        background: '#1890ff',
                                        borderRadius: '50%',
                          
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '20px',
                                        flexShrink: 0
                                    }}>
                                        <EnvironmentOutlined />
                                    </div>
                                    <div className="address-details" style={{ flex: 1 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'flex-start',
                                            marginBottom: '12px'
                                        }}>
                                            <div>
                                                <div style={{ 
                                                    fontSize: '16px', 
                                                    fontWeight: '600', 
                                                    color: '#262626',
                                                    marginBottom: '8px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <UserOutlined style={{ color: '#1890ff' }} />
                                                    {selectedAddress.name}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    color: '#595959',
                                                    marginBottom: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <PhoneOutlined style={{ color: '#52c41a' }} />
                                                    {selectedAddress.phone}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '14px', 
                                                    color: '#595959',
                                                    lineHeight: '1.6',
                                                    marginTop: '8px'
                                                }}>
                                                    <EnvironmentOutlined style={{ marginRight: '6px', color: '#1890ff' }} />
                                                    {selectedAddress.address}, {selectedAddress.ward || ''}, {selectedAddress.district || ''}, {selectedAddress.province || ''}
                                                </div>
                                            </div>
                                            <Button
                                                type="primary"
                                                icon={<EditOutlined />}
                                                size="small"
                                                onClick={() => {
                                                    setShowAddressModal(true);
                                                    // Tự động chọn địa chỉ đã chọn và tính phí ship
                                                    if (selectedAddress.districtId && selectedAddress.wardCode) {
                                                        setFormData(prev => ({
                                                            ...prev,
                                                            provinceId: selectedAddress.provinceId,
                                                            districtId: selectedAddress.districtId,
                                                            wardCode: selectedAddress.wardCode,
                                                        }));
                                                        calculateShippingFee(selectedAddress.districtId, selectedAddress.wardCode);
                                                        fetchDayShip(selectedAddress.districtId, selectedAddress.wardCode);
                                                    }
                                                }}
                                                style={{ flexShrink: 0 }}
                                            >
                                                Thay đổi
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
{/* 
                        <div className="deliver-other-option">
                            <Checkbox
                                checked={deliverToOther}
                                onChange={async (e) => {
                                    const checked = e.target.checked;
                                    setDeliverToOther(checked);

                                    if (checked) {
                                        setFormData(prev => ({
                                            ...prev,
                                            fullName: "",
                                            phone: "",
                                            email: "",
                                            address: "",
                                            provinceId: null,
                                            districtId: null,
                                            wardCode: null,
                                        }));
                                        setDistricts([]);
                                        setWards([]);
                                        setShippingFee(0);
                                        setShippingDate("");
                                    } else {
                                        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
                                        const name = user.ten || (defaultAddress && defaultAddress.name) || "";
                                        const phone = user.soDienThoai || (defaultAddress && defaultAddress.phone) || "";
                                        const email = user.email || "";
                                        const baseAddress = defaultAddress
                                            ? `${defaultAddress.address}, ${defaultAddress.ward}, ${defaultAddress.district}, ${defaultAddress.province}`
                                            : "";

                                        setFormData(prev => ({
                                            ...prev,
                                            fullName: name,
                                            phone,
                                            email,
                                            address: baseAddress,
                                            provinceId: defaultAddress?.provinceId || null,
                                            districtId: defaultAddress?.districtId || null,
                                            wardCode: defaultAddress?.wardCode || null,
                                        }));

                                        if (defaultAddress?.provinceId) {
                                            await loadDistrictsAndWards(defaultAddress.provinceId, defaultAddress.districtId);
                                        }

                                        // Tính lại phí ship và ngày ship khi quay về địa chỉ mặc định
                                        if (defaultAddress?.districtId && defaultAddress?.wardCode && orderProduct.length > 0) {
                                            await calculateShippingFee(defaultAddress.districtId, defaultAddress.wardCode);
                                            await fetchDayShip(defaultAddress.districtId, defaultAddress.wardCode);
                                        }

                                        setDistricts([]);
                                        setWards([]);
                                    }
                                }}
                            >
                                Giao hàng cho người khác nhận
                            </Checkbox>
                        </div> */}

                        {/* Form nhập địa chỉ khi chọn "Giao hàng cho người khác" */}
                        {deliverToOther && (
                            <div className="other-address-form">
                                <Input
                                    placeholder="Họ và tên người nhận *"
                                    value={formData.fullName}
                                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                                    className="form-input"
                                />

                                <Input
                                    placeholder="Số điện thoại người nhận *"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    className="form-input"
                                />
                                <Input
                                    placeholder="Email người nhận *"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="form-input"
                                />

                                <Select
                                    showSearch
                                    placeholder="Chọn Tỉnh / Thành phố *"
                                    className="form-input"
                                    style={{ width: "100%", marginBottom: 12 }}
                                    onChange={handleProvinceChange}
                                    value={formData.provinceId || undefined}
                                    loading={loading.province}
                                    optionFilterProp="children"
                                >
                                    {provinces.map((p) => (
                                        <Option key={p.ProvinceID} value={p.ProvinceID}>
                                            {p.ProvinceName}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    showSearch
                                    placeholder="Chọn Quận / Huyện *"
                                    className="form-input"
                                    style={{ width: "100%", marginBottom: 12 }}
                                    onChange={handleDistrictChange}
                                    value={formData.districtId || undefined}
                                    loading={loading.district}
                                    disabled={!formData.provinceId}
                                    optionFilterProp="children"
                                >
                                    {districts.map((d) => (
                                        <Option key={d.DistrictID} value={d.DistrictID}>
                                            {d.DistrictName}
                                        </Option>
                                    ))}
                                </Select>

                                <Select
                                    showSearch
                                    placeholder="Chọn Xã / Phường *"
                                    className="form-input"
                                    style={{ width: "100%", marginBottom: 12 }}
                                    onChange={handleWardChange}
                                    value={formData.wardCode || undefined}
                                    loading={loading.ward}
                                    disabled={!formData.districtId}
                                    optionFilterProp="children"
                                >
                                    {wards.map((w) => (
                                        <Option key={w.WardCode} value={w.WardCode}>
                                            {w.WardName}
                                        </Option>
                                    ))}
                                </Select>

                                <Input
                                    placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường...) *"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    className="form-input"
                                    style={{ marginBottom: 20 }}
                                />
                            </div>
                        )}

                        <div className="form-section" style={{ marginTop: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontWeight: '500',
                                color: '#262626'
                            }}>
                                Ghi chú đơn hàng (tùy chọn)
                            </label>
                            <textarea
                                placeholder="Nhập ghi chú cho đơn hàng..."
                                value={formData.note || ""}
                                onChange={(e) => handleInputChange('note', e.target.value)}
                                className="form-textarea"
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    padding: '12px',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    resize: 'vertical'
                                }}
                            />
                        </div>

                        <div style={{
                            background: '#f8f9fa',
                            border: '1px solid #e0e0e0',
                            borderRadius: '12px',
                            padding: '20px',
                            marginTop: '24px'
                        }}>
                            <h3 style={{ 
                                marginBottom: '16px', 
                                fontSize: '16px', 
                                fontWeight: '600',
                                color: '#262626'
                            }}>
                                Tóm tắt đơn hàng
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    fontSize: '14px',
                                    color: '#595959'
                                }}>
                                    <span>Tổng tiền hàng:</span>
                                    <span style={{ fontWeight: '500', color: '#262626' }}>
                                        {formatPrice(totalAmount)}
                                    </span>
                                </div>
                                
                                {(() => {
                                    if (isBuyNow) {
                                        return (
                                            <div className="voucher-section" style={{ position: 'relative', marginBottom: '12px' }} ref={dropdownRef}>
                                                <div className="voucher-input-group">
                                                    <input
                                                        type="text"
                                                        placeholder="Nhập hoặc chọn mã giảm giá"
                                                        value={discountCode}
                                                        onChange={(e) => setDiscountCode(e.target.value)}
                                                        onFocus={() => setShowDropdown(true)}
                                                        className="voucher-input"
                                                    />
                                                    <button
                                                        onClick={() => message.info("Mã giảm giá đã được áp dụng!")}
                                                        className="voucher-btn"
                                                    >
                                                        Áp dụng
                                                    </button>
                                                </div>

                                                {showDropdown && (
                                                    <div className="voucher-dropdown">
                                                        {discounts.length === 0 ? (
                                                            <div style={{ padding: '20px', textAlign: 'center', color: '#8c8c8c' }}>
                                                                Không có mã giảm giá khả dụng
                                                            </div>
                                                        ) : (
                                                            discounts.map((voucher) => (
                                                                <div
                                                                    key={voucher.maGiamGia}
                                                                    onClick={() => applyDiscount(voucher)}
                                                                    className={`voucher-item ${selectedDiscount?.maGiamGia === voucher.maGiamGia ? 'selected' : ''}`}
                                                                >
                                                                    <div className="voucher-code">
                                                                        {voucher.ten} ({voucher.maGiamGia})
                                                                    </div>
                                                                    <div className="voucher-desc">
                                                                        Giảm: {voucher.giaTriGiam < 100.00
                                                                            ? `${voucher.giaTriGiam}%${voucher.giaTriMax ? ` (tối đa ${voucher.giaTriMax.toLocaleString('vi-VN')} ₫)` : ''}`
                                                                            : `${voucher.giaTriGiam.toLocaleString('vi-VN')} ₫`}
                                                                    </div>
                                                                    {voucher.giaTriGiam < 100.00 && voucher.giaTriMin && (
                                                                        <div className="voucher-min">
                                                                            Đơn tối thiểu: {voucher.giaTriMin.toLocaleString('vi-VN')} ₫
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                
                                {/* Giảm giá - hiển thị nếu có */}
                                {appliedDiscount > 0 && (
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        fontSize: '14px',
                                        color: '#595959'
                                    }}>
                                        <span>Giảm giá:</span>
                                        <span style={{ fontWeight: '500', color: '#f5222d' }}>
                                            -{formatPrice(appliedDiscount)}
                                        </span>
                                    </div>
                                )}
                                
                                {/* Phí ship */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    fontSize: '14px',
                                    color: '#595959'
                                }}>
                                    <span>Phí vận chuyển:</span>
                                    <span style={{ fontWeight: '500', color: '#262626' }}>
                                        {shippingFeeLoading ? (
                                            <Spin size="small" />
                                        ) : (
                                            (() => {
                                                const totalAfterDiscount = totalAmount - appliedDiscount;
                                                const isFreeShip = totalAfterDiscount >= 5000000;
                                                return isFreeShip ? (
                                                    <span style={{ color: '#52c41a', fontWeight: '600' }}>Miễn phí</span>
                                                ) : (
                                                    formatPrice(shippingFee)
                                                );
                                            })()
                                        )}
                                    </span>
                                </div>
                                
                                <div style={{ 
                                    height: '1px', 
                                    background: '#e0e0e0', 
                                    margin: '12px 0' 
                                }}></div>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between',
                                    fontSize: '18px',
                                    fontWeight: '600',
                                    color: '#262626'
                                }}>
                                    <span>Tổng thanh toán:</span>
                                    <span style={{ color: '#f5222d', fontSize: '20px' }}>
                                        {formatPrice(finalTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="form-section" style={{ marginTop: '32px' }}>
                        <h2 className="form-section-title" style={{ 
                            marginBottom: '20px',
                            fontSize: '18px',
                            fontWeight: '600',
                            color: '#262626'
                        }}>
                            Hình thức thanh toán
                        </h2>

                        <div className="payment-options" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            marginBottom: '24px'
                        }}>
                            <div
                                className={`payment-option ${formData.paymentMethod === "delivery" ? "active" : ""}`}
                                onClick={() => handleInputChange("paymentMethod", "delivery")}
                                style={{
                                    border: formData.paymentMethod === "delivery" ? '2px solid #1890ff' : '2px solid #e0e0e0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    background: formData.paymentMethod === "delivery" ? '#e6f7ff' : '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    fontSize: '32px',
                                    color: formData.paymentMethod === "delivery" ? '#1890ff' : '#8c8c8c'
                                }}>
                                    <TruckOutlined />
                                </div>
                                <div style={{
                                    fontWeight: '500',
                                    color: formData.paymentMethod === "delivery" ? '#1890ff' : '#595959',
                                    textAlign: 'center'
                                }}>
                                    Thanh toán khi nhận hàng
                                </div>
                            </div>
                            
                            <div
                                className={`payment-option ${formData.paymentMethod === "vnpay" ? "active" : ""}`}
                                onClick={() => handleInputChange("paymentMethod", "vnpay")}
                                style={{
                                    border: formData.paymentMethod === "vnpay" ? '2px solid #1890ff' : '2px solid #e0e0e0',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    background: formData.paymentMethod === "vnpay" ? '#e6f7ff' : '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}
                            >
                                <div style={{
                                    fontSize: '32px',
                                    color: formData.paymentMethod === "vnpay" ? '#1890ff' : '#8c8c8c'
                                }}>
                                    <WalletOutlined />
                                </div>
                                <div style={{
                                    fontWeight: '500',
                                    color: formData.paymentMethod === "vnpay" ? '#1890ff' : '#595959',
                                    textAlign: 'center'
                                }}>
                                    Thanh toán VNPAY
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmOrder}
                            disabled={isVNPayProcessing || isDeliveryProcessing}
                            className="checkout-btn"
                            style={{
                                width: '100%',
                                padding: '14px 24px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: '#1890ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: (isVNPayProcessing || isDeliveryProcessing) ? 'not-allowed' : 'pointer',
                                opacity: (isVNPayProcessing || isDeliveryProcessing) ? 0.6 : 1,
                                transition: 'all 0.3s',
                                marginTop: '8px'
                            }}
                            onMouseOver={(e) => {
                                if (!isVNPayProcessing && !isDeliveryProcessing) {
                                    e.target.style.background = '#40a9ff';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (!isVNPayProcessing && !isDeliveryProcessing) {
                                    e.target.style.background = '#1890ff';
                                }
                            }}
                        >
                            Xác nhận đặt hàng
                        </button>
                    </div>
                </div>
            )}

            {/* BƯỚC 3: HOÀN TẤT */}
            {currentStep === 2 && (
                <div className="success-card" style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '48px 32px',
                    textAlign: 'center',
                    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
                    maxWidth: '600px',
                    margin: '0 auto'
                }}>
                    <div style={{
                        fontSize: '80px',
                        color: '#52c41a',
                        marginBottom: '24px',
                        animation: 'scaleIn 0.5s ease-out'
                    }}>
                        <CheckCircleOutlined />
                    </div>
                    <h2 style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: '#262626',
                        marginBottom: '16px'
                    }}>
                        Đặt hàng thành công!
                    </h2>
                    <p style={{
                        fontSize: '16px',
                        color: '#595959',
                        lineHeight: '1.6',
                        marginBottom: '32px'
                    }}>
                        Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi.
                        <br />
                        Chúng tôi sẽ xử lý đơn hàng và liên hệ với bạn trong thời gian sớm nhất.
                    </p>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        <button
                            onClick={() => {
                                setCurrentStep(0);
                                window.location.href = '/';
                            }}
                            style={{
                                padding: '12px 32px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: '#1890ff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#40a9ff'}
                            onMouseOut={(e) => e.target.style.background = '#1890ff'}
                        >
                            Về trang chủ
                        </button>
                        <button
                            onClick={() => {
                                window.location.href = '/orders';
                            }}
                            style={{
                                padding: '12px 32px',
                                fontSize: '16px',
                                fontWeight: '600',
                                background: '#ffffff',
                                color: '#1890ff',
                                border: '2px solid #1890ff',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                            onMouseOver={(e) => {
                                e.target.style.background = '#e6f7ff';
                            }}
                            onMouseOut={(e) => {
                                e.target.style.background = '#ffffff';
                            }}
                        >
                            Xem đơn hàng
                        </button>
                    </div>
                </div>
            )}

            {/* Modal chọn địa chỉ */}
            <Modal
                title="Chọn địa chỉ giao hàng"
                open={showAddressModal}
                onCancel={() => {
                    setShowAddressModal(false);
                    setShowAddAddressForm(false);
                    setEditingAddressId(null);
                    setDeliverToOther(false); // Đảm bảo checkbox không bị check khi đóng modal
                }}
                footer={null}
                width={700}
                className="address-modal"
            >
                {!showAddAddressForm && !editingAddressId ? (
                    <>
                        <div className="address-list">
                            {addressLoading ? (
                                <div style={{ textAlign: 'center', padding: 20 }}>
                                    <Spin />
                                </div>
                            ) : addresses.length === 0 ? (
                                <Empty description="Chưa có địa chỉ" />
                            ) : (
                                addresses.map((address) => (
                                    <div
                                        key={address.id || address.idDiaChi}
                                        className={`address-item ${selectedAddressId === (address.id || address.idDiaChi) ? 'selected' : ''}`}
                                        onClick={() => handleSelectAddress(address)}
                                        style={{
                                            border: address.isDefault 
                                                ? '2px solid #52c41a' 
                                                : (selectedAddressId === (address.id || address.idDiaChi) 
                                                    ? '2px solid #1890ff' 
                                                    : '1px solid #e8e8e8'),
                                            borderRadius: '8px',
                                            padding: '16px',
                                            marginBottom: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            background: address.isDefault 
                                                ? '#f6ffed' 
                                                : (selectedAddressId === (address.id || address.idDiaChi) 
                                                    ? '#f0f7ff' 
                                                    : '#ffffff'),
                                            position: 'relative',
                                            boxShadow: address.isDefault
                                                ? '0 2px 8px rgba(82, 196, 26, 0.15)'
                                                : (selectedAddressId === (address.id || address.idDiaChi)
                                                    ? '0 2px 8px rgba(24, 144, 255, 0.1)'
                                                    : '0 1px 4px rgba(0,0,0,0.05)')
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!address.isDefault && selectedAddressId !== (address.id || address.idDiaChi)) {
                                                e.currentTarget.style.borderColor = '#d9d9d9';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!address.isDefault && selectedAddressId !== (address.id || address.idDiaChi)) {
                                                e.currentTarget.style.borderColor = '#e8e8e8';
                                                e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.05)';
                                            }
                                        }}
                                    >
                                        <div style={{ position: 'relative', width: '100%' }}>
                                            {/* Header: Tag và Buttons */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '12px'
                                            }}>
                                                {address.isDefault && (
                                                    <span style={{
                                                        background: '#52c41a',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '4px',
                                                        fontSize: '12px',
                                                        fontWeight: '500',
                                                        lineHeight: '20px'
                                                    }}>
                                                        Mặc định
                                                    </span>
                                                )}
                                                {!address.isDefault && <div></div>}
                                                <div style={{
                                                    display: 'flex',
                                                    gap: '6px'
                                                }}>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        icon={<EditOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditAddress(address);
                                                        }}
                                                        style={{
                                                            padding: '4px 12px',
                                                            height: 'auto',
                                                            fontSize: '13px',
                                                            background: '#1890ff',
                                                            borderColor: '#1890ff',
                                                            borderRadius: '4px'
                                                        }}
                                                    >
                                                        Sửa
                                                    </Button>
                                                    {!address.isDefault && (
                                                        <Button
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleSetDefaultAddress(address.id || address.idDiaChi);
                                                            }}
                                                            style={{
                                                                padding: '4px 12px',
                                                                height: 'auto',
                                                                fontSize: '13px',
                                                                background: '#52c41a',
                                                                borderColor: '#52c41a',
                                                                color: 'white',
                                                                borderRadius: '4px'
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.background = '#73d13d';
                                                                e.currentTarget.style.borderColor = '#73d13d';
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.background = '#52c41a';
                                                                e.currentTarget.style.borderColor = '#52c41a';
                                                            }}
                                                        >
                                                            Đặt mặc định
                                                        </Button>
                                                    )}
                                                    <Button
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAddress(address.id || address.idDiaChi);
                                                        }}
                                                        style={{
                                                            padding: '4px 12px',
                                                            height: 'auto',
                                                            fontSize: '13px',
                                                            background: '#ff4d4f',
                                                            borderColor: '#ff4d4f',
                                                            color: 'white',
                                                            borderRadius: '4px'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#ff7875';
                                                            e.currentTarget.style.borderColor = '#ff7875';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = '#ff4d4f';
                                                            e.currentTarget.style.borderColor = '#ff4d4f';
                                                        }}
                                                    >
                                                        Xóa
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Content: Tên, SĐT, Địa chỉ */}
                                            <div style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px'
                                                }}>
                                                    <span style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: address.isDefault ? '#52c41a' : '#262626'
                                                    }}>
                                                        {address.name}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '14px',
                                                        color: '#8c8c8c'
                                                    }}>
                                                        {address.phone}
                                                    </span>
                                                </div>
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#595959',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {address.address}, {address.ward || ''}, {address.district || ''}, {address.province || ''}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            className="add-address-btn"
                            onClick={() => {
                                setShowAddAddressForm(true);
                                setEditingAddressId(null);// Đảm bảo checkbox không bị check khi mở form thêm địa chỉ
                            }}
                            block
                        >
                            Thêm địa chỉ mới
                        </Button>
                    </>
                ) : editingAddressId ? (
                    <div className="add-address-form">
                        <h3 className="form-subtitle">Sửa địa chỉ</h3>

                        <div>
                            <Input
                                placeholder="Họ và tên *"
                                value={editAddressForm.name}
                                onChange={(e) => {
                                    setEditAddressForm(prev => ({ ...prev, name: e.target.value }));
                                    if (editAddressErrors.name) {
                                        setEditAddressErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                                className="form-input"
                                status={editAddressErrors.name ? 'error' : ''}
                            />
                            {editAddressErrors.name && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {editAddressErrors.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Số điện thoại *"
                                value={editAddressForm.phone}
                                onChange={(e) => {
                                    setEditAddressForm(prev => ({ ...prev, phone: e.target.value }));
                                    if (editAddressErrors.phone) {
                                        setEditAddressErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                                className="form-input"
                                status={editAddressErrors.phone ? 'error' : ''}
                            />
                            {editAddressErrors.phone && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {editAddressErrors.phone}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Tỉnh / Thành phố *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: editAddressErrors.provinceId ? 4 : 12 }}
                                onChange={async (value) => {
                                    setEditAddressForm(prev => ({ 
                                        ...prev, 
                                        provinceId: value, 
                                        districtId: null, 
                                        wardCode: null 
                                    }));
                                    if (editAddressErrors.provinceId) {
                                        setEditAddressErrors(prev => ({ ...prev, provinceId: '' }));
                                    }
                                    await loadDistrictsForNewAddress(value);
                                }}
                                value={editAddressForm.provinceId || undefined}
                                loading={loading.province}
                                optionFilterProp="children"
                                status={editAddressErrors.provinceId ? 'error' : ''}
                            >
                                {provinces.map((p) => (
                                    <Option key={p.ProvinceID} value={p.ProvinceID}>
                                        {p.ProvinceName}
                                    </Option>
                                ))}
                            </Select>
                            {editAddressErrors.provinceId && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {editAddressErrors.provinceId}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Quận / Huyện *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: editAddressErrors.districtId ? 4 : 12 }}
                                onChange={async (value) => {
                                    setEditAddressForm(prev => ({ 
                                        ...prev, 
                                        districtId: value, 
                                        wardCode: null 
                                    }));
                                    if (editAddressErrors.districtId) {
                                        setEditAddressErrors(prev => ({ ...prev, districtId: '' }));
                                    }
                                    await loadWardsForNewAddress(value);
                                }}
                                value={editAddressForm.districtId || undefined}
                                loading={loading.district}
                                disabled={!editAddressForm.provinceId}
                                optionFilterProp="children"
                                status={editAddressErrors.districtId ? 'error' : ''}
                            >
                                {districts.map((d) => (
                                    <Option key={d.DistrictID} value={d.DistrictID}>
                                        {d.DistrictName}
                                    </Option>
                                ))}
                            </Select>
                            {editAddressErrors.districtId && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {editAddressErrors.districtId}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Xã / Phường *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: editAddressErrors.wardCode ? 4 : 12 }}
                                onChange={(value) => {
                                    setEditAddressForm(prev => ({ 
                                        ...prev, 
                                        wardCode: value 
                                    }));
                                    if (editAddressErrors.wardCode) {
                                        setEditAddressErrors(prev => ({ ...prev, wardCode: '' }));
                                    }
                                }}
                                value={editAddressForm.wardCode || undefined}
                                loading={loading.ward}
                                disabled={!editAddressForm.districtId}
                                optionFilterProp="children"
                                status={editAddressErrors.wardCode ? 'error' : ''}
                            >
                                {wards.map((w) => (
                                    <Option key={w.WardCode} value={w.WardCode}>
                                        {w.WardName}
                                    </Option>
                                ))}
                            </Select>
                            {editAddressErrors.wardCode && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {editAddressErrors.wardCode}
                                </div>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường...) *"
                                value={editAddressForm.address}
                                onChange={(e) => {
                                    setEditAddressForm(prev => ({ ...prev, address: e.target.value }));
                                    if (editAddressErrors.address) {
                                        setEditAddressErrors(prev => ({ ...prev, address: '' }));
                                    }
                                }}
                                className="form-input"
                                style={{ marginBottom: editAddressErrors.address ? 4 : 20 }}
                                status={editAddressErrors.address ? 'error' : ''}
                            />
                            {editAddressErrors.address && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '20px' }}>
                                    {editAddressErrors.address}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <Button onClick={() => {
                                setEditingAddressId(null);
                                setEditAddressForm({
                                    name: "",
                                    phone: "",
                                    address: "",
                                    provinceId: null,
                                    districtId: null,
                                    wardCode: null,
                                });
                                setEditAddressErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" onClick={handleUpdateAddress}>
                                Cập nhật địa chỉ
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="add-address-form">
                        <h3 className="form-subtitle">Thêm địa chỉ mới</h3>

                        <div>
                            <Input
                                placeholder="Họ và tên *"
                                value={newAddressForm.name}
                                onChange={(e) => {
                                    setNewAddressForm(prev => ({ ...prev, name: e.target.value }));
                                    if (newAddressErrors.name) {
                                        setNewAddressErrors(prev => ({ ...prev, name: '' }));
                                    }
                                }}
                                className="form-input"
                                status={newAddressErrors.name ? 'error' : ''}
                            />
                            {newAddressErrors.name && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {newAddressErrors.name}
                                </div>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Số điện thoại *"
                                value={newAddressForm.phone}
                                onChange={(e) => {
                                    setNewAddressForm(prev => ({ ...prev, phone: e.target.value }));
                                    if (newAddressErrors.phone) {
                                        setNewAddressErrors(prev => ({ ...prev, phone: '' }));
                                    }
                                }}
                                className="form-input"
                                status={newAddressErrors.phone ? 'error' : ''}
                            />
                            {newAddressErrors.phone && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {newAddressErrors.phone}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Tỉnh / Thành phố *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: newAddressErrors.provinceId ? 4 : 12 }}
                                onChange={async (value) => {
                                    console.log("📍 Chọn tỉnh:", value);
                                    setNewAddressForm(prev => ({ 
                                        ...prev, 
                                        provinceId: value, 
                                        districtId: null, 
                                        wardCode: null 
                                    }));
                                    if (newAddressErrors.provinceId) {
                                        setNewAddressErrors(prev => ({ ...prev, provinceId: '' }));
                                    }
                                    // Load districts cho tỉnh được chọn
                                    await loadDistrictsForNewAddress(value);
                                }}
                                value={newAddressForm.provinceId || undefined}
                                loading={loading.province}
                                optionFilterProp="children"
                                status={newAddressErrors.provinceId ? 'error' : ''}
                            >
                                {provinces.map((p) => (
                                    <Option key={p.ProvinceID} value={p.ProvinceID}>
                                        {p.ProvinceName}
                                    </Option>
                                ))}
                            </Select>
                            {newAddressErrors.provinceId && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {newAddressErrors.provinceId}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Quận / Huyện *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: newAddressErrors.districtId ? 4 : 12 }}
                                onChange={async (value) => {
                                    console.log("📍 Chọn huyện:", value);
                                    setNewAddressForm(prev => ({ 
                                        ...prev, 
                                        districtId: value, 
                                        wardCode: null 
                                    }));
                                    if (newAddressErrors.districtId) {
                                        setNewAddressErrors(prev => ({ ...prev, districtId: '' }));
                                    }
                                    // Load wards cho huyện được chọn
                                    await loadWardsForNewAddress(value);
                                }}
                                value={newAddressForm.districtId || undefined}
                                loading={loading.district}
                                disabled={!newAddressForm.provinceId}
                                optionFilterProp="children"
                                status={newAddressErrors.districtId ? 'error' : ''}
                            >
                                {districts.map((d) => (
                                    <Option key={d.DistrictID} value={d.DistrictID}>
                                        {d.DistrictName}
                                    </Option>
                                ))}
                            </Select>
                            {newAddressErrors.districtId && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {newAddressErrors.districtId}
                                </div>
                            )}
                        </div>

                        <div>
                            <Select
                                showSearch
                                placeholder="Chọn Xã / Phường *"
                                className="form-input"
                                style={{ width: "100%", marginBottom: newAddressErrors.wardCode ? 4 : 12 }}
                                onChange={async (value) => {
                                    console.log("📍 Chọn xã:", value);
                                    const currentDistrictId = newAddressForm.districtId;
                                    setNewAddressForm(prev => ({ 
                                        ...prev, 
                                        wardCode: value 
                                    }));
                                    if (newAddressErrors.wardCode) {
                                        setNewAddressErrors(prev => ({ ...prev, wardCode: '' }));
                                    }
                                    // Tính phí ship khi thêm địa chỉ mới (nếu đã có đủ thông tin)
                                    if (currentDistrictId && value && orderProduct.length > 0) {
                                        await calculateShippingFee(currentDistrictId, value);
                                    }
                                }}
                                value={newAddressForm.wardCode || undefined}
                                loading={loading.ward}
                                disabled={!newAddressForm.districtId}
                                optionFilterProp="children"
                                status={newAddressErrors.wardCode ? 'error' : ''}
                            >
                                {wards.map((w) => (
                                    <Option key={w.WardCode} value={w.WardCode}>
                                        {w.WardName}
                                    </Option>
                                ))}
                            </Select>
                            {newAddressErrors.wardCode && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '8px' }}>
                                    {newAddressErrors.wardCode}
                                </div>
                            )}
                        </div>

                        <div>
                            <Input
                                placeholder="Nhập địa chỉ cụ thể (số nhà, tên đường...) *"
                                value={newAddressForm.address}
                                onChange={(e) => {
                                    setNewAddressForm(prev => ({ ...prev, address: e.target.value }));
                                    if (newAddressErrors.address) {
                                        setNewAddressErrors(prev => ({ ...prev, address: '' }));
                                    }
                                }}
                                className="form-input"
                                style={{ marginBottom: newAddressErrors.address ? 4 : 20 }}
                                status={newAddressErrors.address ? 'error' : ''}
                            />
                            {newAddressErrors.address && (
                                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px', marginBottom: '20px' }}>
                                    {newAddressErrors.address}
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <Button                             onClick={() => {
                                setShowAddAddressForm(false);
                                setEditingAddressId(null);
                                setDeliverToOther(false); // Đảm bảo checkbox không bị check khi hủy
                                setNewAddressForm({
                                    name: "",
                                    phone: "",
                                    address: "",
                                    provinceId: null,
                                    districtId: null,
                                    wardCode: null,
                                });
                                setNewAddressErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
                            }}>
                                Hủy
                            </Button>
                            <Button type="primary" onClick={handleAddNewAddress}>
                                Thêm địa chỉ
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Fullscreen Loading Overlay cho VNPay và Delivery */}
            {(isVNPayProcessing || isDeliveryProcessing) && (
                <div className="vnpay-loading-overlay">
                    <div className="vnpay-loading-content">
                        <Spin size="large" />
                        <div className="vnpay-loading-text">
                            {isVNPayProcessing ? 'Đang xử lý thanh toán VNPay...' : 'Đang tạo đơn hàng...'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;