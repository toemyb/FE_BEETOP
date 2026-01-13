// src/pages/AdminProfile.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Avatar,
  Button,
  Tag,
  Space,
  Input,
  Select,
  DatePicker,
  Upload,
  Modal,
  Spin,
  message,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  LockOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  SaveOutlined,
  CloseOutlined,
  DeleteOutlined,
  EnvironmentOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import userService from "../service/userService";
import "./AdminProfile.css";

const { Option } = Select;

// ===== GHN master-data =====
const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

const roleColor = (role) => {
  const r = (role || "").toUpperCase();
  if (r.includes("ADMIN")) return "red";
  if (r.includes("NHAN") || r.includes("STAFF") || r.includes("EMP")) return "blue";
  return "default";
};


const formatDate = (d) => {
  if (!d) return "—";
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("vi-VN");
};

const isNumeric = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));
const toNumberOrNull = (v) => (isNumeric(v) ? Number(v) : null);

const AdminProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();

  // ======= loading / user =======
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(user || null);
  const [isEditing, setIsEditing] = useState(false);

  // ======= edit profile form =======
  const [editForm, setEditForm] = useState({
    ten: "",
    tenDangNhap: "",
    email: "",
    soDienThoai: "",
    gioiTinh: "",
    ngaySinh: null,
  });

  const [validationErrors, setValidationErrors] = useState({
    ten: "",
    email: "",
    soDienThoai: "",
    gioiTinh: "",
    ngaySinh: "",
  });

  // ======= avatar upload =======
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // ======= address state =======
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [showAddAddressForm, setShowAddAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingAddress, setLoadingAddress] = useState({ province: false, district: false, ward: false });

  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    address: "",
    provinceId: null,
    districtId: null,
    wardCode: null,
  });

  const [addressValidationErrors, setAddressValidationErrors] = useState({
    name: "",
    phone: "",
    address: "",
    provinceId: "",
    districtId: "",
    wardCode: "",
  });

  // ======= helpers GHN select label =======
  const getSelectedProvinceName = (provinceId) => {
    const pid = toNumberOrNull(provinceId);
    if (!pid) return "";
    return provinces.find((p) => Number(p.ProvinceID) === pid)?.ProvinceName || "";
  };

  const getSelectedDistrictName = (districtId) => {
    const did = toNumberOrNull(districtId);
    if (!did) return "";
    return districts.find((d) => Number(d.DistrictID) === did)?.DistrictName || "";
  };

  const getSelectedWardName = (wardCode) => {
    if (!wardCode) return "";
    return wards.find((w) => String(w.WardCode) === String(wardCode))?.WardName || "";
  };

  // ======= load profile detail (to ensure ID exists) =======
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        let u = user || null;

        if (!u) {
          const raw = sessionStorage.getItem("user");
          if (raw) u = JSON.parse(raw);
        }

        const id =
          u?.id ||
          u?.idTaiKhoan ||
          u?.taiKhoanId ||
          u?.userId ||
          sessionStorage.getItem("idTaiKhoan") ||
          localStorage.getItem("customerId") ||
          null;

        if (!id) {
          setMe(u || null);
          setLoading(false);
          return;
        }

        // ✅ Ensure we have full user detail (incl. id)
        const detail = await userService.getUserDetail(id);
        setMe(detail || u);
        sessionStorage.setItem("user", JSON.stringify(detail || u));

        const finalUser = detail || u;
        setEditForm({
          ten: finalUser?.ten || finalUser?.tenDangNhap || "",
          tenDangNhap: finalUser?.tenDangNhap || "",
          email: finalUser?.email || "",
          soDienThoai: finalUser?.soDienThoai || "",
          gioiTinh: finalUser?.gioiTinh || "",
          ngaySinh: finalUser?.ngaySinh ? dayjs(finalUser.ngaySinh) : null,
        });

        const avatarUrl = finalUser?.anh || finalUser?.anhUrl || null;
        if (avatarUrl) {
          if (String(avatarUrl).startsWith("http")) setAvatarPreview(avatarUrl);
          else setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`);
        } else {
          setAvatarPreview(null);
        }
      } catch (e) {
        console.error(e);
        const raw = sessionStorage.getItem("user");
        setMe(raw ? JSON.parse(raw) : null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  // ======= fetch provinces once =======
  useEffect(() => {
    fetchProvinces();
  }, []);

  const roleLabel = (role) => {
    const r = String(role || "").toUpperCase();
    if (r === "NHAN_VIEN") return "Nhân viên";
    if (r === "ADMIN") return "ADMIN";
    if (r === "KHACH_HANG") return "Khách hàng";
    return role || "—";
  };

  // ======= fetch addresses when me ready =======
  useEffect(() => {
    if (!me) return;
    const id = me?.id || me?.idTaiKhoan || me?.taiKhoanId || sessionStorage.getItem("idTaiKhoan") || null;
    if (!id) return;
    fetchAddresses(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  const display = useMemo(() => {
    if (!me) return null;

    const rawRole =
      me?.tenChucVu ||                 // nếu backend có role string        // tùy bạn đặt tên
      "—";

    const idFromStorage =
      sessionStorage.getItem("idTaiKhoan") ||
      localStorage.getItem("customerId");



    return {
      id: me?.idTaiKhoan ?? me?.taiKhoanId ?? me?.userId ?? idFromStorage ?? "—",
      ten: me?.ten || me?.tenDangNhap || "—",
      tenDangNhap: me?.tenDangNhap || "—",
      email: me?.email || "—",
      soDienThoai: me?.soDienThoai || "—",
      gioiTinh: me?.gioiTinh || "—",
      ngaySinh: formatDate(me?.ngaySinh),
      role: String(rawRole).toUpperCase(),
      anh: me?.anh || me?.anhUrl || null,
    };
  }, [me]);

  // ======= avatar helpers =======
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = String(name).trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarUrl = () => {
    if (avatarPreview) return avatarPreview;
    const avatarUrl = me?.anh || me?.anhUrl;
    if (!avatarUrl) return null;
    if (String(avatarUrl).startsWith("http")) return avatarUrl;
    return `http://localhost:8080${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`;
  };

  const processAvatarFile = (fileObj) => {
    if (!fileObj || !(fileObj instanceof File)) return false;

    if (fileObj.size > 5 * 1024 * 1024) {
      message.error("Kích thước ảnh không được vượt quá 5MB");
      return false;
    }
    if (!fileObj.type.startsWith("image/")) {
      message.error("Chỉ chấp nhận file ảnh");
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.onerror = () => message.error("Lỗi khi đọc file ảnh");
    reader.readAsDataURL(fileObj);

    setAvatarFile(fileObj);
    return true;
  };

  const handleAvatarRemove = () => {
    setAvatarFile(null);
    const avatarUrl = me?.anh || me?.anhUrl || null;
    if (avatarUrl) {
      if (String(avatarUrl).startsWith("http")) setAvatarPreview(avatarUrl);
      else setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`);
    } else {
      setAvatarPreview(null);
    }
  };

  // ======= profile validate =======
  const validateForm = () => {
    const errors = { ten: "", email: "", soDienThoai: "", gioiTinh: "", ngaySinh: "" };
    let ok = true;

    const ten = editForm.ten?.trim() || "";
    if (!ten) {
      errors.ten = "Họ và tên không được để trống";
      ok = false;
    } else if (ten.length < 2 || ten.length > 50) {
      errors.ten = "Họ và tên phải có độ dài từ 2 đến 50 ký tự";
      ok = false;
    }

    const sdt = editForm.soDienThoai?.trim() || "";
    if (!sdt) {
      errors.soDienThoai = "Số điện thoại không được để trống";
      ok = false;
    } else if (!/^\d+$/.test(sdt)) {
      errors.soDienThoai = "Số điện thoại chỉ được chứa số";
      ok = false;
    } else if (sdt.length !== 10) {
      errors.soDienThoai = "Số điện thoại phải có đúng 10 số";
      ok = false;
    } else if (!/^(03|05|07|08|09)/.test(sdt)) {
      errors.soDienThoai = "Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09";
      ok = false;
    }

    const email = editForm.email?.trim() || "";
    if (!email) {
      errors.email = "Email không được để trống";
      ok = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const atCount = (email.match(/@/g) || []).length;
      if (atCount !== 1) {
        errors.email = "Email chỉ được chứa 1 dấu @";
        ok = false;
      } else if (!emailRegex.test(email)) {
        errors.email = "Email không đúng định dạng";
        ok = false;
      }
    }

    if (!editForm.ngaySinh) {
      errors.ngaySinh = "Ngày sinh không được để trống";
      ok = false;
    } else if (!editForm.ngaySinh.isValid?.()) {
      errors.ngaySinh = "Ngày sinh không hợp lệ";
      ok = false;
    } else {
      const today = dayjs();
      if (editForm.ngaySinh.isAfter(today)) {
        errors.ngaySinh = "Ngày sinh không được lớn hơn ngày hiện tại";
        ok = false;
      }
      const age = today.diff(editForm.ngaySinh, "year");
      if (age < 18) {
        errors.ngaySinh = "Bạn phải đủ 18 tuổi trở lên";
        ok = false;
      }
    }

    if (!editForm.gioiTinh || (editForm.gioiTinh !== "Nam" && editForm.gioiTinh !== "Nữ")) {
      errors.gioiTinh = "Vui lòng chọn giới tính (Nam hoặc Nữ)";
      ok = false;
    }

    setValidationErrors(errors);
    return ok;
  };

  // ======= UPDATE ADMIN PROFILE -> đúng API update-employee/{id} =======
  const handleUpdateAdminProfile = async () => {
    if (!validateForm()) {
      message.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    try {
      const id =
        me?.id ??
        me?.idTaiKhoan ??
        me?.taiKhoanId ??
        sessionStorage.getItem("idTaiKhoan") ??
        localStorage.getItem("customerId");

      if (!id || id === "null" || id === "undefined") {
        message.error("Không tìm thấy id tài khoản, vui lòng đăng nhập lại!");
        return;
      }

      // backend updateEmployee nhận ModelAttribute -> multipart
      const payload = {
        ten: editForm.ten.trim(),
        email: editForm.email.trim(),
        soDienThoai: editForm.soDienThoai.trim(),
        gioiTinh: editForm.gioiTinh,
        ngaySinh: editForm.ngaySinh ? editForm.ngaySinh.format("YYYY-MM-DD") : null,
        // nếu backend có field tenDangNhap trong request:
        tenDangNhap: editForm.tenDangNhap?.trim() || me?.tenDangNhap || "",
      };


      const updated = await userService.updateUserByAdmin(id, payload, avatarFile);
      setMe(updated);
      sessionStorage.setItem("user", JSON.stringify(updated));

      setAvatarFile(null);
      setIsEditing(false);
      setValidationErrors({ ten: "", email: "", soDienThoai: "", gioiTinh: "", ngaySinh: "" });
      message.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error(error);
      message.error(error?.message || "Cập nhật thông tin thất bại!");
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);

    const u = me || {};
    setEditForm({
      ten: u.ten || u.tenDangNhap || "",
      tenDangNhap: u.tenDangNhap || "",
      email: u.email || "",
      soDienThoai: u.soDienThoai || "",
      gioiTinh: u.gioiTinh || "",
      ngaySinh: u.ngaySinh ? dayjs(u.ngaySinh) : null,
    });

    const avatarUrl = u.anh || u.anhUrl || null;
    if (avatarUrl) {
      if (String(avatarUrl).startsWith("http")) setAvatarPreview(avatarUrl);
      else setAvatarPreview(`http://localhost:8080${avatarUrl.startsWith("/") ? "" : "/"}${avatarUrl}`);
    } else {
      setAvatarPreview(null);
    }

    setValidationErrors({ ten: "", email: "", soDienThoai: "", gioiTinh: "", ngaySinh: "" });
  };

  // ======= actions giữ nguyên cụm nút =======
  const handleBack = () => navigate("/admin/thong-ke");
  const handleChangePassword = () => navigate("/change-password");

  const handleLogout = () => {
    if (onLogout) return onLogout();
    sessionStorage.clear();
    localStorage.removeItem("isCustomer");
    message.success("Đã đăng xuất");
    navigate("/login");
  };

  // =========================
  // ======= ADDRESS =========
  // =========================

  const fetchProvinces = async () => {
    setLoadingAddress((prev) => ({ ...prev, province: true }));
    try {
      const res = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });
      setProvinces(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress((prev) => ({ ...prev, province: false }));
    }
  };

  const handleProvinceChange = async (provinceId) => {
    setAddressForm((prev) => ({ ...prev, provinceId, districtId: null, wardCode: null }));
    setDistricts([]);
    setWards([]);
    if (!provinceId) return;

    setLoadingAddress((prev) => ({ ...prev, district: true }));
    try {
      const res = await axios.get(urlDistricts, {
        params: { province_id: provinceId },
        headers: { token: tokenApiGHN },
      });
      setDistricts(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress((prev) => ({ ...prev, district: false }));
    }
  };

  const handleDistrictChange = async (districtId) => {
    setAddressForm((prev) => ({ ...prev, districtId, wardCode: null }));
    setWards([]);
    if (!districtId) return;

    setLoadingAddress((prev) => ({ ...prev, ward: true }));
    try {
      const res = await axios.get(urlWard, {
        params: { district_id: districtId },
        headers: { token: tokenApiGHN },
      });
      setWards(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress((prev) => ({ ...prev, ward: false }));
    }
  };

  const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
    const result = { provinceName: "", districtName: "", wardName: "" };
    try {
      const provinceIdNum = toNumberOrNull(provinceId);
      const districtIdNum = toNumberOrNull(districtId);

      if (provinceIdNum) {
        const resProvince = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });
        const list = Array.isArray(resProvince.data.data) ? resProvince.data.data : [];
        const p = list.find((x) => Number(x.ProvinceID) === Number(provinceIdNum));
        if (p?.ProvinceName) result.provinceName = p.ProvinceName;
      }

      if (provinceIdNum && districtIdNum) {
        const resDistrict = await axios.get(urlDistricts, {
          params: { province_id: provinceIdNum },
          headers: { token: tokenApiGHN },
        });
        const list = Array.isArray(resDistrict.data.data) ? resDistrict.data.data : [];
        const d = list.find((x) => Number(x.DistrictID) === Number(districtIdNum));
        if (d?.DistrictName) result.districtName = d.DistrictName;
      }

      if (districtIdNum && wardCode) {
        const resWard = await axios.get(urlWard, {
          params: { district_id: districtIdNum },
          headers: { token: tokenApiGHN },
        });
        const list = Array.isArray(resWard.data.data) ? resWard.data.data : [];
        const w = list.find((x) => String(x.WardCode) === String(wardCode));
        if (w?.WardName) result.wardName = w.WardName;
      }
    } catch (e) {
      console.error(e);
    }
    return result;
  };

  const fetchAddresses = async (taiKhoanId) => {
    try {
      setAddressLoading(true);
      const raw = await userService.getAddressesByCustomer(taiKhoanId);
      const list = Array.isArray(raw) ? raw : [];

      const mapped = await Promise.all(
        list.map(async (a) => {
          const id = a.id || a.idDiaChi || a.idAddress;

          const name = a.name || a.ten || a.hoTen || "";
          const phone = a.phone || a.soDienThoai || "";
          const addressText = a.address || a.diaChiChiTiet || a.diaChi || "";

          const provinceId = toNumberOrNull(a.provinceId ?? a.tinhThanhId ?? a.province_id ?? a.provinceID ?? a.tinhThanh);
          const districtId = toNumberOrNull(a.districtId ?? a.quanHuyenId ?? a.district_id ?? a.districtID ?? a.quanHuyen);
          const wardCode = a.wardCode ?? a.ward_code ?? a.phuongXa ?? null;

          const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh);

          let province = a.tinhThanh || "";
          let district = a.quanHuyen || "";
          let ward = a.phuongXa || "";

          if (provinceId || districtId || wardCode) {
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
            isDefault,
          };
        })
      );

      // default first
      mapped.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setAddressLoading(false);
    }
  };

  const validateAddressForm = () => {
    const errors = { name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" };
    let ok = true;

    const name = addressForm.name?.trim() || "";
    if (!name) {
      errors.name = "Họ và tên không được để trống";
      ok = false;
    } else if (name.length < 2 || name.length > 50) {
      errors.name = "Họ và tên phải có độ dài từ 2 đến 50 ký tự";
      ok = false;
    }

    const phone = addressForm.phone?.trim() || "";
    if (!phone) {
      errors.phone = "Số điện thoại không được để trống";
      ok = false;
    } else if (!/^\d+$/.test(phone)) {
      errors.phone = "Số điện thoại chỉ được chứa số";
      ok = false;
    } else if (phone.length !== 10) {
      errors.phone = "Số điện thoại phải có đúng 10 số";
      ok = false;
    } else if (!/^(03|05|07|08|09)/.test(phone)) {
      errors.phone = "Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09";
      ok = false;
    }

    const address = addressForm.address?.trim() || "";
    if (!address) {
      errors.address = "Địa chỉ chi tiết không được để trống";
      ok = false;
    } else if (address.length < 5) {
      errors.address = "Địa chỉ chi tiết phải có ít nhất 5 ký tự";
      ok = false;
    }

    if (!addressForm.provinceId) {
      errors.provinceId = "Vui lòng chọn tỉnh/thành phố";
      ok = false;
    }
    if (!addressForm.districtId) {
      errors.districtId = "Vui lòng chọn quận/huyện";
      ok = false;
    }
    if (!addressForm.wardCode) {
      errors.wardCode = "Vui lòng chọn phường/xã";
      ok = false;
    }

    setAddressValidationErrors(errors);
    return ok;
  };

  const openAddAddressModal = () => {
    setEditingAddressId(null);
    setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
    setDistricts([]);
    setWards([]);
    setAddressValidationErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
    setShowAddAddressForm(true);
  };

  const handleEditAddress = async (addr) => {
    const provinceId = toNumberOrNull(addr.provinceId ?? addr.tinhThanhId ?? addr.province_id ?? addr.tinhThanh);
    const districtId = toNumberOrNull(addr.districtId ?? addr.quanHuyenId ?? addr.district_id ?? addr.quanHuyen);
    const wardCode = addr.wardCode ?? addr.ward_code ?? addr.phuongXa ?? null;

    // preload districts/wards
    if (provinceId) {
      setLoadingAddress((prev) => ({ ...prev, district: true }));
      try {
        const res = await axios.get(urlDistricts, {
          params: { province_id: provinceId },
          headers: { token: tokenApiGHN },
        });
        setDistricts(res.data.data || []);
      } catch (e) {
        console.error(e);
        setDistricts([]);
      } finally {
        setLoadingAddress((prev) => ({ ...prev, district: false }));
      }

      if (districtId) {
        setLoadingAddress((prev) => ({ ...prev, ward: true }));
        try {
          const res = await axios.get(urlWard, {
            params: { district_id: districtId },
            headers: { token: tokenApiGHN },
          });
          setWards(res.data.data || []);
        } catch (e) {
          console.error(e);
          setWards([]);
        } finally {
          setLoadingAddress((prev) => ({ ...prev, ward: false }));
        }
      }
    }

    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.address || "",
      provinceId: provinceId || null,
      districtId: districtId || null,
      wardCode: wardCode,
    });

    setAddressValidationErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
    setShowAddAddressForm(true);
  };

  const handleAddAddress = async () => {
    if (!validateAddressForm()) {
      message.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    try {
      setAddressLoading(true);

      const taiKhoanId =
        me?.id ??
        me?.idTaiKhoan ??
        me?.taiKhoanId ??
        sessionStorage.getItem("idTaiKhoan") ??
        localStorage.getItem("customerId");

      if (!taiKhoanId) {
        message.error("Không tìm thấy mã tài khoản để thêm địa chỉ!");
        return;
      }

      const provinceName = getSelectedProvinceName(addressForm.provinceId);
      const districtName = getSelectedDistrictName(addressForm.districtId);
      const wardName = getSelectedWardName(addressForm.wardCode);

      const data = {
        idTaiKhoan: taiKhoanId,
        quocGia: "VN",
        hoTen: addressForm.name.trim(),
        soDienThoai: addressForm.phone.trim(),
        diaChiChiTiet: addressForm.address.trim(),

        provinceId: toNumberOrNull(addressForm.provinceId),
        districtId: toNumberOrNull(addressForm.districtId),
        wardCode: addressForm.wardCode,

        tinhThanh: provinceName || String(addressForm.provinceId || ""),
        quanHuyen: districtName || String(addressForm.districtId || ""),
        phuongXa: wardName || String(addressForm.wardCode || ""),
      };

      await userService.createAddressForCustomer(data);
      message.success("Thêm địa chỉ thành công!");

      await fetchAddresses(taiKhoanId);

      setShowAddAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
      setDistricts([]);
      setWards([]);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Thêm địa chỉ thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const performUpdateAddress = async () => {
    try {
      setAddressLoading(true);

      const taiKhoanId =
        me?.id ??
        me?.idTaiKhoan ??
        me?.taiKhoanId ??
        sessionStorage.getItem("idTaiKhoan") ??
        localStorage.getItem("customerId");

      if (!taiKhoanId) {
        message.error("Không tìm thấy mã tài khoản!");
        return;
      }

      const provinceName = getSelectedProvinceName(addressForm.provinceId);
      const districtName = getSelectedDistrictName(addressForm.districtId);
      const wardName = getSelectedWardName(addressForm.wardCode);

      const data = {
        hoTen: addressForm.name.trim(),
        soDienThoai: addressForm.phone.trim(),
        diaChiChiTiet: addressForm.address.trim(),

        provinceId: toNumberOrNull(addressForm.provinceId),
        districtId: toNumberOrNull(addressForm.districtId),
        wardCode: addressForm.wardCode,

        tinhThanh: provinceName || String(addressForm.provinceId || ""),
        quanHuyen: districtName || String(addressForm.districtId || ""),
        phuongXa: wardName || String(addressForm.wardCode || ""),
      };

      await userService.updateAddressForCustomer(editingAddressId, data);
      message.success("Cập nhật địa chỉ thành công!");

      await fetchAddresses(taiKhoanId);

      setShowAddAddressForm(false);
      setEditingAddressId(null);
      setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
      setDistricts([]);
      setWards([]);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Cập nhật địa chỉ thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const handleUpdateAddress = async () => {
    if (!validateAddressForm()) {
      message.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    Modal.confirm({
      title: "Xác nhận cập nhật",
      content: "Bạn có chắc chắn muốn cập nhật địa chỉ này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: async () => {
        await performUpdateAddress();
      },
    });
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
          await userService.deleteAddress(addressId);
          message.success("Xóa địa chỉ thành công!");

          const taiKhoanId =
            me?.id ??
            me?.idTaiKhoan ??
            me?.taiKhoanId ??
            sessionStorage.getItem("idTaiKhoan") ??
            localStorage.getItem("customerId");

          if (taiKhoanId) await fetchAddresses(taiKhoanId);
        } catch (e) {
          console.error(e);
          message.error(e?.message || "Không thể xóa địa chỉ!");
        } finally {
          setAddressLoading(false);
        }
      },
    });
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      setAddressLoading(true);
      await userService.setDefaultAddress(addressId);
      message.success("Đặt địa chỉ mặc định thành công!");

      const taiKhoanId =
        me?.id ??
        me?.idTaiKhoan ??
        me?.taiKhoanId ??
        sessionStorage.getItem("idTaiKhoan") ??
        localStorage.getItem("customerId");

      if (taiKhoanId) await fetchAddresses(taiKhoanId);
    } catch (e) {
      console.error(e);
      message.error(e?.message || "Đặt địa chỉ mặc định thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  // ======= render =======
  if (loading) {
    return (
      <div className="profileWrap">
        <Card className="profileCard">
          <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
            <Spin size="large" />
          </div>
        </Card>
      </div>
    );
  }

  if (!display) {
    return (
      <div className="profileWrap">
        <Card className="profileCard">
          <div className="profileEmpty">
            <UserOutlined style={{ fontSize: 28, opacity: 0.6 }} />
            <div>Chưa có thông tin người dùng. Vui lòng đăng nhập lại.</div>
            <Button type="primary" onClick={() => navigate("/login")}>
              Đi tới đăng nhập
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="profileWrap">
      <Card className="profileCard" bordered={false}>
        {/* ===== Header (giữ cụm nút như ảnh 2) ===== */}
        <div className="profileTop">
          <div className="profileIdentity">
            <div className="profileAvatarSection">
              {isEditing ? (
                <div className="avatarEditBox">
                  <Avatar
                    size={72}
                    src={getAvatarUrl() || undefined}
                    icon={!getAvatarUrl() && <UserOutlined />}
                    className="profileAvatar"
                  >
                    {!getAvatarUrl() && getInitials(display.ten)}
                  </Avatar>

                  <Upload
                    name="avatar"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      processAvatarFile(file);
                      return false;
                    }}
                    accept="image/*"
                    maxCount={1}
                  >
                    <Button size="small" icon={<EditOutlined />}>
                      Chọn ảnh
                    </Button>
                  </Upload>

                  {avatarFile && (
                    <Button danger size="small" icon={<DeleteOutlined />} onClick={handleAvatarRemove}>
                      Xóa ảnh
                    </Button>
                  )}
                </div>
              ) : (
                <Avatar
                  size={72}
                  src={getAvatarUrl() || undefined}
                  icon={!getAvatarUrl() && <UserOutlined />}
                  className="profileAvatar"
                >
                  {!getAvatarUrl() && getInitials(display.ten)}
                </Avatar>
              )}
            </div>

            <div className="profileNameBlock">
              <div className="profileNameRow">
                <div className="profileName">{display.ten}</div>
                <Tag color={roleColor(display.role)} className="profileRole">
                  {roleLabel(display.role)}
                </Tag>
              </div>

              <div className="profileSub">
                <span className="muted">
                  <IdcardOutlined /> {display.id}
                </span>
                <span className="dot">•</span>
                <span className="muted">
                  <MailOutlined /> {display.email}
                </span>
              </div>
            </div>
          </div>

          <Space className="profileActions">
            <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
              Dashboard
            </Button>

            {isEditing && (
              <Button icon={<CloseOutlined />} onClick={handleCancelEdit}>
                Hủy
              </Button>
            )}

            <Button
              type="primary"
              icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
              onClick={() => {
                if (isEditing) {
                  Modal.confirm({
                    title: "Xác nhận cập nhật",
                    content: "Bạn có chắc chắn muốn lưu thay đổi thông tin tài khoản?",
                    okText: "Xác nhận",
                    cancelText: "Hủy",
                    onOk: () => handleUpdateAdminProfile(),
                  });
                } else {
                  setIsEditing(true);
                }
              }}
            >
              {isEditing ? "Lưu" : "Sửa"}
            </Button>

            <Button icon={<LockOutlined />} onClick={handleChangePassword}>
              Đổi mật khẩu
            </Button>

            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              Đăng xuất
            </Button>
          </Space>
        </div>

        {/* ===== Body ===== */}
        <div className="adminContent">
          {/* ===== Thông tin tài khoản ===== */}
          <Card
            className="adminInfoCard"
            bordered={false}
            title={
              <div className="cardTitle">
                <UserOutlined />
                <span>Thông tin tài khoản</span>
              </div>
            }
          >
            <div className="infoGrid">
              {/* ID */}
              <div className="infoItem">
                <IdcardOutlined className="infoIcon" />
                <div className="infoDetails">
                  <div className="infoLabel">ID</div>
                  <div className="infoValue">{display.id}</div>
                </div>
              </div>

              {/* Họ và tên */}
              <div className="infoItem">
                <UserOutlined className="infoIcon" />
                <div className="infoDetails">
                  <div className="infoLabel">Họ và tên</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.ten}
                        onChange={(e) => {
                          setEditForm((p) => ({ ...p, ten: e.target.value }));
                          if (validationErrors.ten) setValidationErrors((p) => ({ ...p, ten: "" }));
                        }}
                        placeholder="Nhập họ và tên"
                        status={validationErrors.ten ? "error" : ""}
                      />
                      {validationErrors.ten && <div className="errorText">{validationErrors.ten}</div>}
                    </div>
                  ) : (
                    <div className="infoValue">{display.ten}</div>
                  )}
                </div>
              </div>

              {/* SĐT */}
              <div className="infoItem">
                <PhoneOutlined className="infoIcon" />
                <div className="infoDetails">
                  <div className="infoLabel">Số điện thoại</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.soDienThoai}
                        disabled
                        onChange={(e) => {
                          setEditForm((p) => ({ ...p, soDienThoai: e.target.value }));
                          if (validationErrors.soDienThoai)
                            setValidationErrors((p) => ({ ...p, soDienThoai: "" }));
                        }}
                        placeholder="Nhập số điện thoại"
                        status={validationErrors.soDienThoai ? "error" : ""}
                      />
                      {validationErrors.soDienThoai && (
                        <div className="errorText">{validationErrors.soDienThoai}</div>
                      )}
                    </div>
                  ) : (
                    <div className="infoValue">{display.soDienThoai}</div>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="infoItem">
                <MailOutlined className="infoIcon" />
                <div className="infoDetails">
                  <div className="infoLabel">Email</div>
                  {isEditing ? (
                    <div>
                      <Input
                        value={editForm.email}
                        disabled
                        onChange={(e) => {
                          setEditForm((p) => ({ ...p, email: e.target.value }));
                          if (validationErrors.email) setValidationErrors((p) => ({ ...p, email: "" }));
                        }}
                        placeholder="Nhập email"
                        status={validationErrors.email ? "error" : ""}
                      />
                      {validationErrors.email && <div className="errorText">{validationErrors.email}</div>}
                    </div>
                  ) : (
                    <div className="infoValue">{display.email}</div>
                  )}
                </div>
              </div>

              {/* Giới tính */}
              <div className="infoItem">
                {display.gioiTinh === "Nam" || String(display.gioiTinh).toUpperCase() === "MALE" ? (
                  <ManOutlined className="infoIcon" />
                ) : display.gioiTinh === "Nữ" || String(display.gioiTinh).toUpperCase() === "FEMALE" ? (
                  <WomanOutlined className="infoIcon" />
                ) : (
                  <UserOutlined className="infoIcon" />
                )}

                <div className="infoDetails">
                  <div className="infoLabel">Giới tính</div>
                  {isEditing ? (
                    <div>
                      <Select
                        value={editForm.gioiTinh}
                        onChange={(v) => {
                          setEditForm((p) => ({ ...p, gioiTinh: v }));
                          if (validationErrors.gioiTinh) setValidationErrors((p) => ({ ...p, gioiTinh: "" }));
                        }}
                        placeholder="Chọn giới tính"
                        style={{ width: "100%" }}
                        status={validationErrors.gioiTinh ? "error" : ""}
                      >
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                      </Select>
                      {validationErrors.gioiTinh && <div className="errorText">{validationErrors.gioiTinh}</div>}
                    </div>
                  ) : (
                    <div className="infoValue">{display.gioiTinh}</div>
                  )}
                </div>
              </div>

              {/* Ngày sinh */}
              <div className="infoItem">
                <CalendarOutlined className="infoIcon" />
                <div className="infoDetails">
                  <div className="infoLabel">Ngày sinh</div>
                  {isEditing ? (
                    <div>
                      <DatePicker
                        value={editForm.ngaySinh}
                        onChange={(d) => {
                          setEditForm((p) => ({ ...p, ngaySinh: d }));
                          if (validationErrors.ngaySinh) setValidationErrors((p) => ({ ...p, ngaySinh: "" }));
                        }}
                        format="DD/MM/YYYY"
                        style={{ width: "100%" }}
                        status={validationErrors.ngaySinh ? "error" : ""}
                      />
                      {validationErrors.ngaySinh && <div className="errorText">{validationErrors.ngaySinh}</div>}
                    </div>
                  ) : (
                    <div className="infoValue">{display.ngaySinh}</div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* ===== Địa chỉ giao hàng (giống Profile) ===== */}
          <Card
            className="adminInfoCard"
            bordered={false}
            title={
              <div className="cardTitle">
                <EnvironmentOutlined />
                <span>Địa chỉ</span>
              </div>
            }
            style={{ marginTop: 16 }}
          >
            <div style={{ marginBottom: 16 }}>
              <Button type="primary" icon={<PlusOutlined />} onClick={openAddAddressModal}>
                Thêm địa chỉ mới
              </Button>
            </div>

            {addressLoading ? (
              <Spin />
            ) : (
              <div className="addressList">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="addressItem"
                    style={{
                      border: address.isDefault ? "2px solid #1890ff" : "1px solid #e0e0e0",
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 12,
                      background: address.isDefault ? "#e6f7ff" : "#fff",
                      boxShadow: address.isDefault ? "0 2px 8px rgba(24, 144, 255, 0.2)" : "none",
                    }}
                  >
                    <div className="addressItemContent" style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
                      <div className="addressItemInfo">
                        {address.isDefault && (
                          <Tag color="blue" style={{ marginBottom: 8, fontWeight: 600 }}>
                            Mặc định
                          </Tag>
                        )}
                        <div style={{ fontWeight: 600, marginBottom: 4, color: address.isDefault ? "#1890ff" : "#262626" }}>
                          {address.name}
                        </div>
                        <div style={{ color: "#595959", marginBottom: 4 }}>{address.phone}</div>
                        <div style={{ color: "#595959" }}>
                          {address.address}, {address.ward}, {address.district}, {address.province}
                        </div>
                      </div>

                      <div className="addressItemActions" style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                        {!address.isDefault && (
                          <Button size="small" onClick={() => handleSetDefaultAddress(address.id)}>
                            Đặt mặc định
                          </Button>
                        )}
                        <Button size="small" icon={<EditOutlined />} onClick={() => handleEditAddress(address)}>
                          Sửa
                        </Button>
                        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteAddress(address.id)}>
                          Xóa
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {addresses.length === 0 && (
                  <div style={{ textAlign: "center", color: "#8c8c8c", padding: 40 }}>
                    Chưa có địa chỉ nào
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </Card>

      {/* ===== Modal thêm/sửa địa chỉ ===== */}
      <Modal
        title={editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
        open={showAddAddressForm}
        onCancel={() => {
          setShowAddAddressForm(false);
          setEditingAddressId(null);
          setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
          setAddressValidationErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
          setDistricts([]);
          setWards([]);
        }}
        footer={null}
        width={600}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <Input
              placeholder="Họ và tên"
              value={addressForm.name}
              onChange={(e) => {
                setAddressForm((prev) => ({ ...prev, name: e.target.value }));
                if (addressValidationErrors.name) setAddressValidationErrors((prev) => ({ ...prev, name: "" }));
              }}
              status={addressValidationErrors.name ? "error" : ""}
            />
            {addressValidationErrors.name && <div className="errorText">{addressValidationErrors.name}</div>}
          </div>

          <div>
            <Input
              placeholder="Số điện thoại"
              value={addressForm.phone}
              onChange={(e) => {
                setAddressForm((prev) => ({ ...prev, phone: e.target.value }));
                if (addressValidationErrors.phone) setAddressValidationErrors((prev) => ({ ...prev, phone: "" }));
              }}
              status={addressValidationErrors.phone ? "error" : ""}
            />
            {addressValidationErrors.phone && <div className="errorText">{addressValidationErrors.phone}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Tỉnh/Thành phố"
              value={addressForm.provinceId}
              onChange={(value) => {
                handleProvinceChange(value);
                if (addressValidationErrors.provinceId) setAddressValidationErrors((prev) => ({ ...prev, provinceId: "" }));
              }}
              loading={loadingAddress.province}
              style={{ width: "100%" }}
              status={addressValidationErrors.provinceId ? "error" : ""}
            >
              {provinces.map((p) => (
                <Option key={p.ProvinceID} value={p.ProvinceID}>
                  {p.ProvinceName}
                </Option>
              ))}
            </Select>
            {addressValidationErrors.provinceId && <div className="errorText">{addressValidationErrors.provinceId}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Quận/Huyện"
              value={addressForm.districtId}
              onChange={(value) => {
                handleDistrictChange(value);
                if (addressValidationErrors.districtId) setAddressValidationErrors((prev) => ({ ...prev, districtId: "" }));
              }}
              loading={loadingAddress.district}
              disabled={!addressForm.provinceId}
              style={{ width: "100%" }}
              status={addressValidationErrors.districtId ? "error" : ""}
            >
              {districts.map((d) => (
                <Option key={d.DistrictID} value={d.DistrictID}>
                  {d.DistrictName}
                </Option>
              ))}
            </Select>
            {addressValidationErrors.districtId && <div className="errorText">{addressValidationErrors.districtId}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Xã/Phường"
              value={addressForm.wardCode}
              onChange={(value) => {
                setAddressForm((prev) => ({ ...prev, wardCode: value }));
                if (addressValidationErrors.wardCode) setAddressValidationErrors((prev) => ({ ...prev, wardCode: "" }));
              }}
              loading={loadingAddress.ward}
              disabled={!addressForm.districtId}
              style={{ width: "100%" }}
              status={addressValidationErrors.wardCode ? "error" : ""}
            >
              {wards.map((w) => (
                <Option key={w.WardCode} value={w.WardCode}>
                  {w.WardName}
                </Option>
              ))}
            </Select>
            {addressValidationErrors.wardCode && <div className="errorText">{addressValidationErrors.wardCode}</div>}
          </div>

          <div>
            <Input.TextArea
              placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
              value={addressForm.address}
              onChange={(e) => {
                setAddressForm((prev) => ({ ...prev, address: e.target.value }));
                if (addressValidationErrors.address) setAddressValidationErrors((prev) => ({ ...prev, address: "" }));
              }}
              rows={3}
              status={addressValidationErrors.address ? "error" : ""}
            />
            {addressValidationErrors.address && <div className="errorText">{addressValidationErrors.address}</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Button
              onClick={() => {
                setShowAddAddressForm(false);
                setEditingAddressId(null);
                setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
                setAddressValidationErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
                setDistricts([]);
                setWards([]);
              }}
            >
              Hủy
            </Button>

            <Button
              type="primary"
              onClick={editingAddressId ? handleUpdateAddress : handleAddAddress}
              loading={addressLoading}
            >
              {editingAddressId ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminProfile;
