import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  ManOutlined,
  WomanOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Card, Avatar, Button, Tag, Spin, Input, Select, DatePicker, Modal, message, Upload } from 'antd';
import dayjs from 'dayjs';
import axios from 'axios';
import { getAllAddress, addAddress, deleteAddress, setDefaultAddress, updateAddress } from '../service/AddressCustomerService';
import userService from '../service/userService';
import './Profile.css';

const { Option } = Select;
const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState({ province: false, district: false, ward: false });
  const navigate = useNavigate();
  const handleChangePassword = () => navigate('/change-password');
  const isNumeric = (v) => v !== null && v !== undefined && v !== '' && !Number.isNaN(Number(v));
  const toNumberOrNull = (v) => (isNumeric(v) ? Number(v) : null);

  const getSelectedProvinceName = (provinceId) => {
    const pid = toNumberOrNull(provinceId);
    if (!pid) return "";
    return provinces.find(p => Number(p.ProvinceID) === pid)?.ProvinceName || "";
  };

  const getSelectedDistrictName = (districtId) => {
    const did = toNumberOrNull(districtId);
    if (!did) return "";
    return districts.find(d => Number(d.DistrictID) === did)?.DistrictName || "";
  };



  const getSelectedWardName = (wardCode) => {
    if (!wardCode) return "";
    return wards.find(w => String(w.WardCode) === String(wardCode))?.WardName || "";
  };

  // Form chỉnh sửa thông tin
  const [editForm, setEditForm] = useState({
    ten: '',
    email: '',
    soDienThoai: '',
    gioiTinh: '',
    ngaySinh: null
  });

  // State cho upload ảnh
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // State lưu lỗi validation
  const [validationErrors, setValidationErrors] = useState({
    ten: '',
    email: '',
    soDienThoai: '',
    gioiTinh: '',
    ngaySinh: ''
  });

  // State lưu lỗi validation cho địa chỉ
  const [addressValidationErrors, setAddressValidationErrors] = useState({
    name: '',
    phone: '',
    address: '',
    provinceId: '',
    districtId: '',
    wardCode: ''
  });

  // Form địa chỉ
  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    provinceId: null,
    districtId: null,
    wardCode: null,
  });

  useEffect(() => {
    const userData = sessionStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEditForm({
          ten: parsedUser.ten || '',
          email: parsedUser.email || '',
          soDienThoai: parsedUser.soDienThoai || '',
          gioiTinh: parsedUser.gioiTinh || '',
          ngaySinh: parsedUser.ngaySinh ? dayjs(parsedUser.ngaySinh) : null
        });
        // Set preview ảnh từ user hiện tại
        if (parsedUser.anh || parsedUser.anhUrl) {
          const avatarUrl = parsedUser.anh || parsedUser.anhUrl;
          if (avatarUrl.startsWith('http')) {
            setAvatarPreview(avatarUrl);
          } else {
            setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`);
          }
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
    fetchProvinces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAddresses = async () => {
    try {
      setAddressLoading(true);
      const customerId =
        localStorage.getItem("customerId") || sessionStorage.getItem("idTaiKhoan");
      if (customerId) {
        const response = await getAllAddress(customerId);
        const raw = Array.isArray(response) ? response : response?.data || [];
        const mapped = await Promise.all(raw.map(async (a) => {
          const id = a.id || a.idDiaChi || a.idAddress;

          const name = a.name || a.ten || a.hoTen || "";
          const phone = a.phone || a.soDienThoai || "";
          const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";

          // Ưu tiên lấy đúng ID (provinceId/districtId/wardCode). Nếu backend trả tên (tinhThanh/quanHuyen/phuongXa)
          // thì sẽ không ép kiểu số để tránh NaN.
          const provinceId = toNumberOrNull(
            a.provinceId ?? a.tinhThanhId ?? a.province_id ?? a.provinceID ?? a.tinhThanh
          );
          const districtId = toNumberOrNull(
            a.districtId ?? a.quanHuyenId ?? a.district_id ?? a.districtID ?? a.quanHuyen
          );
          const wardCode = a.wardCode ?? a.ward_code ?? a.phuongXa ?? null;

          const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh);

          let province = "";
          let district = "";
          let ward = "";

          if (provinceId || districtId || wardCode) {
            const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
            province = names.provinceName || a.tinhThanh || "";
            district = names.districtName || a.quanHuyen || "";
            ward = names.wardName || a.phuongXa || "";
          } else {
            province = a.tinhThanh || "";
            district = a.quanHuyen || "";
            ward = a.phuongXa || "";
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
        }));

        // Sắp xếp: địa chỉ mặc định lên đầu
        const sorted = mapped.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });
        setAddresses(sorted);
      }
    } catch (error) {
      console.error("Lỗi khi lấy địa chỉ:", error);
    } finally {
      setAddressLoading(false);
    }
  };

  const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
    const result = { provinceName: "", districtName: "", wardName: "" };
    try {
      const provinceIdNum = toNumberOrNull(provinceId);
      const districtIdNum = toNumberOrNull(districtId);

      if (provinceIdNum) {
        const resProvince = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });

        let provinceList = [];
        if (Array.isArray(resProvince.data.data)) {
          provinceList = resProvince.data.data;
        } else if (resProvince.data.data && resProvince.data.data.ProvinceID) {
          provinceList = [resProvince.data.data];
        }

        const province = provinceList.find(p => Number(p.ProvinceID) === Number(provinceIdNum));
        if (province?.ProvinceName) {
          result.provinceName = province.ProvinceName;
        }
      }

      if (districtIdNum && provinceIdNum) {
        const resDistrict = await axios.get(urlDistricts, {
          params: { province_id: provinceIdNum },
          headers: { token: tokenApiGHN }
        });

        let districtList = [];
        if (Array.isArray(resDistrict.data.data)) {
          districtList = resDistrict.data.data;
        } else if (resDistrict.data.data && resDistrict.data.data.DistrictID) {
          districtList = [resDistrict.data.data];
        }

        const district = districtList.find(d => Number(d.DistrictID) === Number(districtIdNum));
        if (district?.DistrictName) {
          result.districtName = district.DistrictName;
        }
      }

      if (wardCode && districtIdNum) {
        const resWard = await axios.get(urlWard, {
          params: { district_id: districtIdNum },
          headers: { token: tokenApiGHN }
        });

        let wardList = [];
        if (Array.isArray(resWard.data.data)) {
          wardList = resWard.data.data;
        } else if (resWard.data.data && resWard.data.data.WardCode) {
          wardList = [resWard.data.data];
        }

        const ward = wardList.find(w => String(w.WardCode) === String(wardCode));
        if (ward?.WardName) {
          result.wardName = ward.WardName;
        }
      }
    } catch (error) {
      console.error("Lỗi khi load tên địa chỉ:", error);
    }
    return result;
  };

  const fetchProvinces = async () => {
    setLoadingAddress(prev => ({ ...prev, province: true }));
    try {
      const res = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });
      setProvinces(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy tỉnh:", error);
    } finally {
      setLoadingAddress(prev => ({ ...prev, province: false }));
    }
  };

  const handleProvinceChange = async (provinceId) => {
    setAddressForm(prev => ({ ...prev, provinceId, districtId: null, wardCode: null }));
    setDistricts([]);
    setWards([]);
    if (!provinceId) return;
    setLoadingAddress(prev => ({ ...prev, district: true }));
    try {
      const res = await axios.get(urlDistricts, {
        params: { province_id: provinceId },
        headers: { token: tokenApiGHN }
      });
      setDistricts(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy huyện:", error);
    } finally {
      setLoadingAddress(prev => ({ ...prev, district: false }));
    }
  };

  const handleDistrictChange = async (districtId) => {
    setAddressForm(prev => ({ ...prev, districtId, wardCode: null }));
    setWards([]);
    if (!districtId) return;
    setLoadingAddress(prev => ({ ...prev, ward: true }));
    try {
      const res = await axios.get(urlWard, {
        params: { district_id: districtId },
        headers: { token: tokenApiGHN }
      });
      setWards(res.data.data || []);
    } catch (error) {
      console.error("Lỗi khi lấy xã:", error);
    } finally {
      setLoadingAddress(prev => ({ ...prev, ward: false }));
    }
  };

  // Hàm validation
  const validateForm = () => {
    const errors = {
      ten: '',
      email: '',
      soDienThoai: '',
      gioiTinh: '',
      ngaySinh: ''
    };
    let isValid = true;

    // Validate tên
    const ten = editForm.ten?.trim() || '';
    if (!ten) {
      errors.ten = 'Họ và tên không được để trống';
      isValid = false;
    } else if (ten.length < 2 || ten.length > 50) {
      errors.ten = 'Họ và tên phải có độ dài từ 2 đến 50 ký tự';
      isValid = false;
    } else if (!/^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/.test(ten)) {
      errors.ten = 'Họ và tên chỉ được chứa chữ cái, dấu tiếng Việt và khoảng trắng';
      isValid = false;
    }

    // Validate số điện thoại
    const soDienThoai = editForm.soDienThoai?.trim() || '';
    if (!soDienThoai) {
      errors.soDienThoai = 'Số điện thoại không được để trống';
      isValid = false;
    } else if (!/^\d+$/.test(soDienThoai)) {
      errors.soDienThoai = 'Số điện thoại chỉ được chứa số';
      isValid = false;
    } else if (soDienThoai.length !== 10) {
      errors.soDienThoai = 'Số điện thoại phải có đúng 10 số';
      isValid = false;
    } else if (!/^(03|05|07|08|09)/.test(soDienThoai)) {
      errors.soDienThoai = 'Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09';
      isValid = false;
    }

    // Validate email
    const email = editForm.email?.trim() || '';
    if (!email) {
      errors.email = 'Email không được để trống';
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const atCount = (email.match(/@/g) || []).length;

      if (atCount !== 1) {
        errors.email = 'Email chỉ được chứa 1 dấu @';
        isValid = false;
      } else if (!emailRegex.test(email)) {
        errors.email = 'Email không đúng định dạng';
        isValid = false;
      } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
        errors.email = 'Email chứa ký tự không hợp lệ';
        isValid = false;
      }
    }

    // Validate ngày sinh
    if (!editForm.ngaySinh) {
      errors.ngaySinh = 'Ngày sinh không được để trống';
      isValid = false;
    } else {
      const selectedDate = editForm.ngaySinh;
      const today = dayjs();
      const age = today.diff(selectedDate, 'year');

      if (selectedDate.isAfter(today)) {
        errors.ngaySinh = 'Ngày sinh không được lớn hơn ngày hiện tại';
        isValid = false;
      } else if (age < 18) {
        errors.ngaySinh = 'Bạn phải đủ 18 tuổi trở lên';
        isValid = false;
      } else if (!selectedDate.isValid()) {
        errors.ngaySinh = 'Ngày sinh không hợp lệ';
        isValid = false;
      }
    }

    // Validate giới tính
    if (!editForm.gioiTinh || (editForm.gioiTinh !== 'Nam' && editForm.gioiTinh !== 'Nữ')) {
      errors.gioiTinh = 'Vui lòng chọn giới tính (Nam hoặc Nữ)';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) {
      message.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      const customerId =
        localStorage.getItem("customerId") || sessionStorage.getItem("idTaiKhoan");

      if (!customerId || customerId === "null" || customerId === "undefined") {
        message.error("Không tìm thấy id tài khoản, vui lòng đăng nhập lại!");
        return;
      }

      let anhUrl = user?.anh || user?.anhUrl || null;

      if (avatarFile) {
        try {
          const uploadResponse = await userService.uploadAvatar(avatarFile);
          anhUrl = uploadResponse?.anhUrl || uploadResponse?.anh || uploadResponse?.url || null;
          if (anhUrl) {
            message.success('Upload ảnh thành công!');
          }
        } catch (uploadError) {
          console.warn('Không thể upload ảnh, giữ nguyên ảnh cũ:', uploadError);
          message.warning('Không thể upload ảnh mới, giữ nguyên ảnh cũ');
        }
      }

      const payload = {
        ten: editForm.ten.trim(),
        email: editForm.email.trim(),
        soDienThoai: editForm.soDienThoai.trim(),
        gioiTinh: editForm.gioiTinh,
        ngaySinh: editForm.ngaySinh ? editForm.ngaySinh.format('YYYY-MM-DD') : null,
        anhUrl: anhUrl,
      };

      const response = await userService.updateCustomerAccount(customerId, payload);

      const updatedUser = {
        ...user,
        ...payload,
        ngaySinh: payload.ngaySinh,
        anh: response?.anh || response?.anhUrl || anhUrl || user?.anh || null,
        anhUrl: response?.anhUrl || response?.anh || anhUrl || user?.anhUrl || null,
      };

      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      if (updatedUser.anh || updatedUser.anhUrl) {
        const newAvatarUrl = updatedUser.anh || updatedUser.anhUrl;
        if (newAvatarUrl.startsWith('http')) {
          setAvatarPreview(newAvatarUrl);
        } else {
          setAvatarPreview(`http://localhost:8080${newAvatarUrl.startsWith('/') ? '' : '/'}${newAvatarUrl}`);
        }
      }

      setAvatarFile(null);
      setIsEditing(false);
      setValidationErrors({ ten: '', email: '', soDienThoai: '', gioiTinh: '', ngaySinh: '' });
      message.success('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Lỗi khi cập nhật:', error);
      message.error(error.message || 'Cập nhật thông tin thất bại!');
    }
  };

  // Hàm validation cho địa chỉ
  const validateAddressForm = () => {
    const errors = {
      name: '',
      phone: '',
      address: '',
      provinceId: '',
      districtId: '',
      wardCode: ''
    };
    let isValid = true;

    const name = addressForm.name?.trim() || '';
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

    const phone = addressForm.phone?.trim() || '';
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

    const address = addressForm.address?.trim() || '';
    if (!address) {
      errors.address = 'Địa chỉ chi tiết không được để trống';
      isValid = false;
    } else if (address.length < 5) {
      errors.address = 'Địa chỉ chi tiết phải có ít nhất 5 ký tự';
      isValid = false;
    }

    if (!addressForm.provinceId) {
      errors.provinceId = 'Vui lòng chọn tỉnh/thành phố';
      isValid = false;
    }
    if (!addressForm.districtId) {
      errors.districtId = 'Vui lòng chọn quận/huyện';
      isValid = false;
    }
    if (!addressForm.wardCode) {
      errors.wardCode = 'Vui lòng chọn phường/xã';
      isValid = false;
    }

    setAddressValidationErrors(errors);
    return isValid;
  };

  const handleAddAddress = async () => {
    if (!validateAddressForm()) {
      message.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    try {
      setAddressLoading(true);
      const customerId =
        localStorage.getItem("customerId") || sessionStorage.getItem("idTaiKhoan");

      const provinceName = getSelectedProvinceName(addressForm.provinceId);
      const districtName = getSelectedDistrictName(addressForm.districtId);
      const wardName = getSelectedWardName(addressForm.wardCode);

      const addressData = {
        idTaiKhoan: customerId,
        quocGia: "VN",
        hoTen: addressForm.name,
        soDienThoai: addressForm.phone,
        diaChiChiTiet: addressForm.address,

        // ✅ Gửi cả ID chuẩn lẫn tên (backend dùng field nào cũng nhận được)
        provinceId: toNumberOrNull(addressForm.provinceId),
        districtId: toNumberOrNull(addressForm.districtId),
        wardCode: addressForm.wardCode,

        tinhThanh: provinceName || (addressForm.provinceId != null ? String(addressForm.provinceId) : ""),
        quanHuyen: districtName || (addressForm.districtId != null ? String(addressForm.districtId) : ""),
        phuongXa: wardName || (addressForm.wardCode != null ? String(addressForm.wardCode) : ""),
      };

      const newAddress = await addAddress(addressData);
      message.success("Thêm địa chỉ thành công!");

      const newAddressInfo = {
        name: addressForm.name.trim(),
        phone: addressForm.phone.trim(),
        address: addressForm.address.trim(),
        provinceId: addressForm.provinceId,
        districtId: addressForm.districtId,
        wardCode: addressForm.wardCode
      };

      const response = await getAllAddress(customerId);
      const raw = Array.isArray(response) ? response : response?.data || [];
      const mapped = await Promise.all(raw.map(async (a) => {
        const id = a.id || a.idDiaChi || a.idAddress;
        const name = a.name || a.ten || a.hoTen || "";
        const phone = a.phone || a.soDienThoai || "";
        const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";

        const provinceId = toNumberOrNull(
          a.provinceId ?? a.tinhThanhId ?? a.province_id ?? a.provinceID ?? a.tinhThanh
        );
        const districtId = toNumberOrNull(
          a.districtId ?? a.quanHuyenId ?? a.district_id ?? a.districtID ?? a.quanHuyen
        );
        const wardCode = a.wardCode ?? a.ward_code ?? a.phuongXa ?? null;

        const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh);

        let province = "";
        let district = "";
        let ward = "";
        if (provinceId || districtId || wardCode) {
          const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
          province = names.provinceName || a.tinhThanh || "";
          district = names.districtName || a.quanHuyen || "";
          ward = names.wardName || a.phuongXa || "";
        } else {
          province = a.tinhThanh || "";
          district = a.quanHuyen || "";
          ward = a.phuongXa || "";
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
      }));

      const newAddressId = newAddress?.id ||
        newAddress?.data?.id ||
        newAddress?.data?.idDiaChi ||
        newAddress?.data?.idAddress ||
        newAddress?.idDiaChi ||
        newAddress?.idAddress;

      const sorted = mapped.sort((a, b) => {
        const aId = String(a.id || '');
        const bId = String(b.id || '');
        const newId = String(newAddressId || '');

        const aIsNew = aId === newId || (
          String(a.provinceId) === String(newAddressInfo.provinceId) &&
          String(a.districtId) === String(newAddressInfo.districtId) &&
          String(a.wardCode) === String(newAddressInfo.wardCode) &&
          a.name.trim() === newAddressInfo.name &&
          a.phone.trim() === newAddressInfo.phone &&
          a.address.trim() === newAddressInfo.address
        );
        const bIsNew = bId === newId || (
          String(b.provinceId) === String(newAddressInfo.provinceId) &&
          String(b.districtId) === String(newAddressInfo.districtId) &&
          String(b.wardCode) === String(newAddressInfo.wardCode) &&
          b.name.trim() === newAddressInfo.name &&
          b.phone.trim() === newAddressInfo.phone &&
          b.address.trim() === newAddressInfo.address
        );

        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;

        if (aIsNew && !bIsNew) return -1;
        if (!aIsNew && bIsNew) return 1;

        return 0;
      });

      setAddresses(sorted);

      setAddressForm({ name: '', phone: '', address: '', provinceId: null, districtId: null, wardCode: null });
      setAddressValidationErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
      setShowAddAddressForm(false);
    } catch (error) {
      console.error("Lỗi khi thêm địa chỉ:", error);
      message.error("Thêm địa chỉ thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleEditAddress = async (address) => {
    const provinceId = toNumberOrNull(address.provinceId ?? address.tinhThanhId ?? address.province_id ?? address.tinhThanh);
    const districtId = toNumberOrNull(address.districtId ?? address.quanHuyenId ?? address.district_id ?? address.quanHuyen);
    const wardCode = address.wardCode ?? address.ward_code ?? address.phuongXa ?? null;

    if (provinceId) {
      setLoadingAddress(prev => ({ ...prev, district: true }));
      try {
        const res = await axios.get(urlDistricts, {
          params: { province_id: provinceId },
          headers: { token: tokenApiGHN }
        });
        const districtList = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
        setDistricts(districtList);
      } catch (error) {
        console.error("Lỗi khi lấy huyện:", error);
        setDistricts([]);
      } finally {
        setLoadingAddress(prev => ({ ...prev, district: false }));
      }

      if (districtId) {
        setLoadingAddress(prev => ({ ...prev, ward: true }));
        try {
          const res = await axios.get(urlWard, {
            params: { district_id: districtId },
            headers: { token: tokenApiGHN }
          });
          const wardList = Array.isArray(res.data.data) ? res.data.data : (res.data.data ? [res.data.data] : []);
          setWards(wardList);
        } catch (error) {
          console.error("Lỗi khi lấy xã:", error);
          setWards([]);
        } finally {
          setLoadingAddress(prev => ({ ...prev, ward: false }));
        }
      }
    }

    setAddressForm({
      name: address.name || '',
      phone: address.phone || '',
      address: address.address || '',
      provinceId: provinceId || null,
      districtId: districtId || null,
      wardCode: wardCode,
    });
    setEditingAddressId(address.id);
    setShowAddAddressForm(true);
  };

  const handleUpdateAddress = async () => {
    if (!validateAddressForm()) {
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

      const provinceName = getSelectedProvinceName(addressForm.provinceId);
      const districtName = getSelectedDistrictName(addressForm.districtId);
      const wardName = getSelectedWardName(addressForm.wardCode);

      const addressData = {
        hoTen: addressForm.name,
        soDienThoai: addressForm.phone,
        diaChiChiTiet: addressForm.address,

        // ✅ gửi cả ID + tên
        provinceId: toNumberOrNull(addressForm.provinceId),
        districtId: toNumberOrNull(addressForm.districtId),
        wardCode: addressForm.wardCode,

        tinhThanh: provinceName || (addressForm.provinceId != null ? String(addressForm.provinceId) : ""),
        quanHuyen: districtName || (addressForm.districtId != null ? String(addressForm.districtId) : ""),
        phuongXa: wardName || (addressForm.wardCode != null ? String(addressForm.wardCode) : ""),
      };

      await updateAddress(editingAddressId, addressData);
      message.success("Cập nhật địa chỉ thành công!");

      const customerId =
        localStorage.getItem("customerId") || sessionStorage.getItem("idTaiKhoan");
      const response = await getAllAddress(customerId);
      const raw = Array.isArray(response) ? response : response?.data || [];
      const mapped = await Promise.all(raw.map(async (a) => {
        const id = a.id || a.idDiaChi || a.idAddress;
        const name = a.name || a.ten || a.hoTen || "";
        const phone = a.phone || a.soDienThoai || "";
        const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";

        const provinceId = toNumberOrNull(
          a.provinceId ?? a.tinhThanhId ?? a.province_id ?? a.provinceID ?? a.tinhThanh
        );
        const districtId = toNumberOrNull(
          a.districtId ?? a.quanHuyenId ?? a.district_id ?? a.districtID ?? a.quanHuyen
        );
        const wardCode = a.wardCode ?? a.ward_code ?? a.phuongXa ?? null;

        const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh);

        let province = "";
        let district = "";
        let ward = "";

        if (provinceId || districtId || wardCode) {
          const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
          province = names.provinceName || a.tinhThanh || "";
          district = names.districtName || a.quanHuyen || "";
          ward = names.wardName || a.phuongXa || "";
        } else {
          province = a.tinhThanh || "";
          district = a.quanHuyen || "";
          ward = a.phuongXa || "";
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
      }));

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

      setAddressForm({ name: '', phone: '', address: '', provinceId: null, districtId: null, wardCode: null });
      setAddressValidationErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
      setEditingAddressId(null);
      setShowAddAddressForm(false);
    } catch (error) {
      console.error("Lỗi khi cập nhật địa chỉ:", error);
      message.error("Cập nhật địa chỉ thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleDeleteAddress = (addressId) => {
    Modal.confirm({
      title: "Xóa địa chỉ",
      content: "Bạn có chắc chắn muốn xóa địa chỉ này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      onOk: async () => {
        try {
          setAddressLoading(true);
          await deleteAddress(addressId);
          message.success("Xóa địa chỉ thành công!");
          await fetchAddresses();
        } catch (error) {
          console.error("Lỗi khi xóa địa chỉ:", error);
          message.error("Địa chỉ đã từng mua hàng không thể xóa được!");
        } finally {
          setAddressLoading(false);
        }
      }
    });
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      setAddressLoading(true);
      await setDefaultAddress(addressId);
      message.success("Đặt địa chỉ mặc định thành công!");
      await fetchAddresses();
    } catch (error) {
      console.error("Lỗi khi đặt địa chỉ mặc định:", error);
      message.error("Đặt địa chỉ mặc định thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (avatarPreview) {
      return avatarPreview;
    }
    if (user?.anh) {
      if (user.anh.startsWith('http')) return user.anh;
      return `http://localhost:8080${user.anh.startsWith('/') ? '' : '/'}${user.anh}`;
    }
    if (user?.anhUrl) {
      if (user.anhUrl.startsWith('http')) return user.anhUrl;
      return `http://localhost:8080${user.anhUrl.startsWith('/') ? '' : '/'}${user.anhUrl}`;
    }
    return null;
  };

  const processAvatarFile = (fileObj) => {
    if (!fileObj || !(fileObj instanceof File)) {
      return false;
    }

    if (fileObj.size > 5 * 1024 * 1024) {
      message.error('Kích thước ảnh không được vượt quá 5MB');
      return false;
    }

    if (!fileObj.type.startsWith('image/')) {
      message.error('Chỉ chấp nhận file ảnh');
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target.result;
      setAvatarPreview(result);
    };
    reader.onerror = () => {
      message.error('Lỗi khi đọc file ảnh');
    };
    reader.readAsDataURL(fileObj);

    setAvatarFile(fileObj);
    return true;
  };

  const handleAvatarChange = (info) => {
    const { file } = info;
    const fileObj = file.originFileObj || file;
    processAvatarFile(fileObj);
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    if (user?.anh || user?.anhUrl) {
      const avatarUrl = user.anh || user.anhUrl;
      if (avatarUrl.startsWith('http')) {
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`);
      }
    } else {
      setAvatarPreview(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Chưa cập nhật";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-empty">
          <UserOutlined style={{ fontSize: '64px', color: '#d9d9d9', marginBottom: '24px' }} />
          <h2>Thông tin cá nhân</h2>
          <p style={{ color: '#8c8c8c', fontSize: '16px', marginBottom: '24px' }}>
            Bạn chưa đăng nhập. Vui lòng đăng nhập để xem thông tin cá nhân.
          </p>
          <Button type="primary" size="large" onClick={() => navigate('/login')}>
            Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <Card className="profile-header-card" bordered={false}>
          <div className="profile-header">
            <div className="profile-avatar-section">
              {isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Avatar size={120} src={getAvatarUrl()} icon={<UserOutlined />} className="profile-avatar">
                    {!getAvatarUrl() && getInitials(user.ten)}
                  </Avatar>
                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      processAvatarFile(file);
                      return false;
                    }}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    maxCount={1}
                  >
                    <Button icon={<EditOutlined />} size="small">
                      Chọn ảnh
                    </Button>
                  </Upload>
                  {avatarFile && (
                    <Button
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                      onClick={handleAvatarRemove}
                    >
                      Xóa ảnh
                    </Button>
                  )}
                </div>
              ) : (
                <Avatar size={120} src={getAvatarUrl()} icon={<UserOutlined />} className="profile-avatar">
                  {!getAvatarUrl() && getInitials(user.ten)}
                </Avatar>
              )}
            </div>
            <div className="profile-header-info">
              <h1 className="profile-name">{user.ten || 'Người dùng'}</h1>
              <div className="profile-meta">
                <CalendarOutlined style={{ marginRight: '8px' }} />
                <span>Thành viên từ {formatDate(user.ngaySinh) || 'Chưa cập nhật'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {isEditing && (
                <Button
                  icon={<CloseOutlined />}
                  size="large"
                  onClick={() => {
                    setIsEditing(false);
                    setAvatarFile(null);
                    if (user?.anh || user?.anhUrl) {
                      const avatarUrl = user.anh || user.anhUrl;
                      if (avatarUrl.startsWith('http')) {
                        setAvatarPreview(avatarUrl);
                      } else {
                        setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`);
                      }
                    } else {
                      setAvatarPreview(null);
                    }
                    setEditForm({
                      ten: user.ten || '',
                      email: user.email || '',
                      soDienThoai: user.soDienThoai || '',
                      gioiTinh: user.gioiTinh || '',
                      ngaySinh: user.ngaySinh ? dayjs(user.ngaySinh) : null
                    });
                    setValidationErrors({ ten: '', email: '', soDienThoai: '', gioiTinh: '', ngaySinh: '' });
                  }}
                >
                  Hủy
                </Button>
              )}
              <Button
                type="primary"
                icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
                size="large"
                onClick={() => {
                  if (isEditing) {
                    Modal.confirm({
                      title: 'Xác nhận cập nhật',
                      content: 'Bạn có chắc chắn muốn lưu thay đổi thông tin cá nhân?',
                      okText: 'Xác nhận',
                      cancelText: 'Hủy',
                      onOk: () => {
                        handleUpdateProfile();
                      },
                    });
                  } else {
                    setIsEditing(true);
                    if (user?.anh || user?.anhUrl) {
                      const avatarUrl = user.anh || user.anhUrl;
                      if (avatarUrl.startsWith('http')) {
                        setAvatarPreview(avatarUrl);
                      } else {
                        setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`);
                      }
                    }
                  }
                }}
              >
                {isEditing ? 'Lưu' : 'Chỉnh sửa'}
              </Button>
            </div>
            <Button
              icon={<LockOutlined />}
              size="large"
              onClick={handleChangePassword}
              disabled={isEditing} // optional: đang sửa thì disable cho khỏi rối
            >
              Đổi mật khẩu
            </Button>
          </div>
        </Card>

        <div className="profile-content">
          <Card className="profile-info-card" title={
            <div className="card-title">
              <UserOutlined />
              <span>Thông tin cá nhân</span>
            </div>
          } bordered={false}>
            <div className="info-grid">
              <div className="info-item">
                <UserOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Họ và tên</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.ten}
                        onChange={(e) => {
                          setEditForm(prev => ({ ...prev, ten: e.target.value }));
                          if (validationErrors.ten) {
                            setValidationErrors(prev => ({ ...prev, ten: '' }));
                          }
                        }}
                        placeholder="Nhập họ và tên"
                        status={validationErrors.ten ? 'error' : ''}
                      />
                      {validationErrors.ten && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{validationErrors.ten}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-value">{user.ten || "Chưa cập nhật"}</div>
                  )}
                </div>
              </div>

              <div className="info-item">
                <PhoneOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Số điện thoại</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.soDienThoai}
                        onChange={(e) => {
                          setEditForm(prev => ({ ...prev, soDienThoai: e.target.value }));
                          if (validationErrors.soDienThoai) {
                            setValidationErrors(prev => ({ ...prev, soDienThoai: '' }));
                          }
                        }}
                        placeholder="Nhập số điện thoại"
                        status={validationErrors.soDienThoai ? 'error' : ''}
                      />
                      {validationErrors.soDienThoai && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{validationErrors.soDienThoai}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-value">{user.soDienThoai || "Chưa cập nhật"}</div>
                  )}
                </div>
              </div>

              <div className="info-item">
                <MailOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Email</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.email}
                        onChange={(e) => {
                          setEditForm(prev => ({ ...prev, email: e.target.value }));
                          if (validationErrors.email) {
                            setValidationErrors(prev => ({ ...prev, email: '' }));
                          }
                        }}
                        placeholder="Nhập email"
                        status={validationErrors.email ? 'error' : ''}
                      />
                      {validationErrors.email && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{validationErrors.email}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-value">{user.email || "Chưa cập nhật"}</div>
                  )}
                </div>
              </div>

              <div className="info-item">
                {user.gioiTinh === 'Nam' || user.gioiTinh === 'MALE' ? (
                  <ManOutlined className="info-icon-static" />
                ) : user.gioiTinh === 'Nữ' || user.gioiTinh === 'FEMALE' ? (
                  <WomanOutlined className="info-icon-static" />
                ) : (
                  <UserOutlined className="info-icon-static" />
                )}
                <div className="info-details">
                  <div className="info-label">Giới tính</div>
                  {isEditing ? (
                    <div>
                      <Select
                        value={editForm.gioiTinh}
                        onChange={(value) => {
                          setEditForm(prev => ({ ...prev, gioiTinh: value }));
                          if (validationErrors.gioiTinh) {
                            setValidationErrors(prev => ({ ...prev, gioiTinh: '' }));
                          }
                        }}
                        placeholder="Chọn giới tính"
                        style={{ width: '100%' }}
                        status={validationErrors.gioiTinh ? 'error' : ''}
                      >
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                      {validationErrors.gioiTinh && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{validationErrors.gioiTinh}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-value">{user.gioiTinh || "Chưa cập nhật"}</div>
                  )}
                </div>
              </div>

              <div className="info-item">
                <CalendarOutlined className="info-icon-static" />
                <div className="info-details">
                  <div className="info-label">Ngày sinh</div>
                  {isEditing ? (
                    <div>
                      <DatePicker
                        value={editForm.ngaySinh}
                        onChange={(date) => {
                          setEditForm(prev => ({ ...prev, ngaySinh: date }));
                          if (validationErrors.ngaySinh) {
                            setValidationErrors(prev => ({ ...prev, ngaySinh: '' }));
                          }
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: '100%' }}
                        status={validationErrors.ngaySinh ? 'error' : ''}
                      />
                      {validationErrors.ngaySinh && (
                        <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{validationErrors.ngaySinh}</div>
                      )}
                    </div>
                  ) : (
                    <div className="info-value">{formatDate(user.ngaySinh)}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card className="profile-info-card" title={
            <div className="card-title">
              <EnvironmentOutlined />
              <span>Địa chỉ giao hàng</span>
            </div>
          } bordered={false}>
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setShowAddAddressForm(true);
                  setEditingAddressId(null);
                  setAddressForm({ name: '', phone: '', address: '', provinceId: null, districtId: null, wardCode: null });
                }}
              >
                Thêm địa chỉ mới
              </Button>
            </div>

            {addressLoading ? (
              <Spin />
            ) : (
              <div className="address-list">
                {addresses.map((address) => (
                  <div key={address.id} className="address-item" style={{
                    border: address.isDefault ? '2px solid #1890ff' : '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    background: address.isDefault ? '#e6f7ff' : '#fff',
                    boxShadow: address.isDefault ? '0 2px 8px rgba(24, 144, 255, 0.2)' : 'none'
                  }}>
                    <div className="address-item-content">
                      <div className="address-item-info">
                        {address.isDefault && (
                          <Tag color="blue" style={{ marginBottom: '8px', fontWeight: '600' }}>Mặc định</Tag>
                        )}
                        <div style={{ fontWeight: '600', marginBottom: '4px', color: address.isDefault ? '#1890ff' : '#262626' }}>{address.name}</div>
                        <div style={{ color: '#595959', marginBottom: '4px' }}>{address.phone}</div>
                        <div style={{ color: '#595959' }}>
                          {address.address}, {address.ward}, {address.district}, {address.province}
                        </div>
                      </div>
                      <div className="address-item-actions">
                        {!address.isDefault && (
                          <Button
                            size="small"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Đặt mặc định
                          </Button>
                        )}
                        <Button
                          size="small"
                          icon={<EditOutlined />}
                          onClick={() => handleEditAddress(address)}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '40px' }}>
                    Chưa có địa chỉ nào
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal
        title={editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
        open={showAddAddressForm}
        onCancel={() => {
          setShowAddAddressForm(false);
          setEditingAddressId(null);
          setAddressForm({ name: '', phone: '', address: '', provinceId: null, districtId: null, wardCode: null });
          setAddressValidationErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
        }}
        footer={null}
        width={600}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <Input
              placeholder="Họ và tên"
              value={addressForm.name}
              onChange={(e) => {
                setAddressForm(prev => ({ ...prev, name: e.target.value }));
                if (addressValidationErrors.name) {
                  setAddressValidationErrors(prev => ({ ...prev, name: '' }));
                }
              }}
              status={addressValidationErrors.name ? 'error' : ''}
            />
            {addressValidationErrors.name && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.name}</div>
            )}
          </div>
          <div>
            <Input
              placeholder="Số điện thoại"
              value={addressForm.phone}
              onChange={(e) => {
                setAddressForm(prev => ({ ...prev, phone: e.target.value }));
                if (addressValidationErrors.phone) {
                  setAddressValidationErrors(prev => ({ ...prev, phone: '' }));
                }
              }}
              status={addressValidationErrors.phone ? 'error' : ''}
            />
            {addressValidationErrors.phone && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.phone}</div>
            )}
          </div>
          <div>
            <Select
              placeholder="Chọn Tỉnh/Thành phố"
              value={addressForm.provinceId}
              onChange={(value) => {
                handleProvinceChange(value);
                if (addressValidationErrors.provinceId) {
                  setAddressValidationErrors(prev => ({ ...prev, provinceId: '' }));
                }
              }}
              loading={loadingAddress.province}
              style={{ width: '100%' }}
              status={addressValidationErrors.provinceId ? 'error' : ''}
            >
              {provinces.map(p => (
                <Option key={p.ProvinceID} value={p.ProvinceID}>{p.ProvinceName}</Option>
              ))}
            </Select>
            {addressValidationErrors.provinceId && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.provinceId}</div>
            )}
          </div>
          <div>
            <Select
              placeholder="Chọn Quận/Huyện"
              value={addressForm.districtId}
              onChange={(value) => {
                handleDistrictChange(value);
                if (addressValidationErrors.districtId) {
                  setAddressValidationErrors(prev => ({ ...prev, districtId: '' }));
                }
              }}
              loading={loadingAddress.district}
              disabled={!addressForm.provinceId}
              style={{ width: '100%' }}
              status={addressValidationErrors.districtId ? 'error' : ''}
            >
              {districts.map(d => (
                <Option key={d.DistrictID} value={d.DistrictID}>{d.DistrictName}</Option>
              ))}
            </Select>
            {addressValidationErrors.districtId && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.districtId}</div>
            )}
          </div>
          <div>
            <Select
              placeholder="Chọn Xã/Phường"
              value={addressForm.wardCode}
              onChange={(value) => {
                setAddressForm(prev => ({ ...prev, wardCode: value }));
                if (addressValidationErrors.wardCode) {
                  setAddressValidationErrors(prev => ({ ...prev, wardCode: '' }));
                }
              }}
              loading={loadingAddress.ward}
              disabled={!addressForm.districtId}
              style={{ width: '100%' }}
              status={addressValidationErrors.wardCode ? 'error' : ''}
            >
              {wards.map(w => (
                <Option key={w.WardCode} value={w.WardCode}>{w.WardName}</Option>
              ))}
            </Select>
            {addressValidationErrors.wardCode && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.wardCode}</div>
            )}
          </div>
          <div>
            <Input.TextArea
              placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
              value={addressForm.address}
              onChange={(e) => {
                setAddressForm(prev => ({ ...prev, address: e.target.value }));
                if (addressValidationErrors.address) {
                  setAddressValidationErrors(prev => ({ ...prev, address: '' }));
                }
              }}
              rows={3}
              status={addressValidationErrors.address ? 'error' : ''}
            />
            {addressValidationErrors.address && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{addressValidationErrors.address}</div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
            <Button onClick={() => {
              setShowAddAddressForm(false);
              setEditingAddressId(null);
              setAddressForm({ name: '', phone: '', address: '', provinceId: null, districtId: null, wardCode: null });
              setAddressValidationErrors({ name: '', phone: '', address: '', provinceId: '', districtId: '', wardCode: '' });
            }}>
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
              loading={addressLoading}
            >
              {editingAddressId ? 'Cập nhật' : 'Thêm'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
