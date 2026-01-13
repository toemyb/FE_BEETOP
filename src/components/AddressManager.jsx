// src/components/AddressManager.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Button, Input, Modal, Select, Spin, Tag } from "antd";
import { toast } from "react-toastify";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import axios from "axios";
import userService from "../service/userService";

const { Option } = Select;

// ===== GHN master-data (giống AdminProfile) =====
const tokenApiGHN = "7d67a984-b5fe-11ef-b166-4205c1d15e61";
const urlProvince = "https://online-gateway.ghn.vn/shiip/public-api/master-data/province";
const urlDistricts = "https://online-gateway.ghn.vn/shiip/public-api/master-data/district";
const urlWard = "https://online-gateway.ghn.vn/shiip/public-api/master-data/ward";

const isNumeric = (v) => v !== null && v !== undefined && v !== "" && !Number.isNaN(Number(v));
const toNumberOrNull = (v) => (isNumeric(v) ? Number(v) : null);

const AddressManager = ({ taiKhoanId, onDefaultChange }) => {
  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);

  const [showModal, setShowModal] = useState(false);
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

  const [errors, setErrors] = useState({
    name: "",
    phone: "",
    address: "",
    provinceId: "",
    districtId: "",
    wardCode: "",
  });

  // ===== helpers GHN name =====
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

  // ===== fetch provinces once =====
  useEffect(() => {
    (async () => {
      setLoadingAddress((p) => ({ ...p, province: true }));
      try {
        const res = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });
        setProvinces(res.data?.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAddress((p) => ({ ...p, province: false }));
      }
    })();
  }, []);

  const handleProvinceChange = async (provinceId) => {
    setAddressForm((p) => ({ ...p, provinceId, districtId: null, wardCode: null }));
    setDistricts([]);
    setWards([]);
    if (!provinceId) return;

    setLoadingAddress((p) => ({ ...p, district: true }));
    try {
      const res = await axios.get(urlDistricts, {
        params: { province_id: provinceId },
        headers: { token: tokenApiGHN },
      });
      setDistricts(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress((p) => ({ ...p, district: false }));
    }
  };

  const handleDistrictChange = async (districtId) => {
    setAddressForm((p) => ({ ...p, districtId, wardCode: null }));
    setWards([]);
    if (!districtId) return;

    setLoadingAddress((p) => ({ ...p, ward: true }));
    try {
      const res = await axios.get(urlWard, {
        params: { district_id: districtId },
        headers: { token: tokenApiGHN },
      });
      setWards(res.data?.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddress((p) => ({ ...p, ward: false }));
    }
  };

  const loadAddressNamesFromIds = async (provinceId, districtId, wardCode) => {
    const result = { provinceName: "", districtName: "", wardName: "" };
    try {
      const provinceIdNum = toNumberOrNull(provinceId);
      const districtIdNum = toNumberOrNull(districtId);

      if (provinceIdNum) {
        const resProvince = await axios.get(urlProvince, { headers: { token: tokenApiGHN } });
        const list = Array.isArray(resProvince.data?.data) ? resProvince.data.data : [];
        const p = list.find((x) => Number(x.ProvinceID) === Number(provinceIdNum));
        if (p?.ProvinceName) result.provinceName = p.ProvinceName;
      }

      if (provinceIdNum && districtIdNum) {
        const resDistrict = await axios.get(urlDistricts, {
          params: { province_id: provinceIdNum },
          headers: { token: tokenApiGHN },
        });
        const list = Array.isArray(resDistrict.data?.data) ? resDistrict.data.data : [];
        const d = list.find((x) => Number(x.DistrictID) === Number(districtIdNum));
        if (d?.DistrictName) result.districtName = d.DistrictName;
      }

      if (districtIdNum && wardCode) {
        const resWard = await axios.get(urlWard, {
          params: { district_id: districtIdNum },
          headers: { token: tokenApiGHN },
        });
        const list = Array.isArray(resWard.data?.data) ? resWard.data.data : [];
        const w = list.find((x) => String(x.WardCode) === String(wardCode));
        if (w?.WardName) result.wardName = w.WardName;
      }
    } catch (e) {
      console.error(e);
    }
    return result;
  };

  const fetchAddresses = async () => {
    if (!taiKhoanId) return;
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

          const provinceId = toNumberOrNull(a.provinceId ?? a.tinhThanhId ?? a.province_id ?? a.provinceID);
          const districtId = toNumberOrNull(a.districtId ?? a.quanHuyenId ?? a.district_id ?? a.districtID);
          const wardCode = a.wardCode ?? a.ward_code ?? a.phuongXa ?? null;

          const isDefault = !!(a.macDinh || a.isDefault || a.diaChiMacDinh);

          // text name fallback
          let provinceName = a.tinhThanh || "";
          let districtName = a.quanHuyen || "";
          let wardName = a.phuongXa || "";

          if (provinceId || districtId || wardCode) {
            const names = await loadAddressNamesFromIds(provinceId, districtId, wardCode);
            provinceName = names.provinceName || provinceName;
            districtName = names.districtName || districtName;
            wardName = names.wardName || wardName;
          }

          return {
            ...a,
            id,
            name,
            phone,
            diaChiChiTiet: addressText,
            provinceId,
            districtId,
            wardCode,
            provinceName,
            districtName,
            wardName,
            isDefault,
          };
        })
      );

      mapped.sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1));
      setAddresses(mapped);

      const def = mapped.find((x) => x.isDefault) || mapped[0] || null;
      onDefaultChange?.(def);
    } catch (e) {
      console.error(e);
    } finally {
      setAddressLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taiKhoanId]);

  const validate = () => {
    const e = { name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" };
    let ok = true;

    const name = addressForm.name?.trim() || "";
    if (!name) {
      e.name = "Họ và tên không được để trống";
      ok = false;
    } else if (name.length < 2 || name.length > 50) {
      e.name = "Họ và tên phải có độ dài từ 2 đến 50 ký tự";
      ok = false;
    }

    const phone = addressForm.phone?.trim() || "";
    if (!phone) {
      e.phone = "Số điện thoại không được để trống";
      ok = false;
    } else if (!/^\d+$/.test(phone)) {
      e.phone = "Số điện thoại chỉ được chứa số";
      ok = false;
    } else if (phone.length !== 10) {
      e.phone = "Số điện thoại phải có đúng 10 số";
      ok = false;
    } else if (!/^(03|05|07|08|09)/.test(phone)) {
      e.phone = "Số điện thoại phải bắt đầu bằng 03, 05, 07, 08 hoặc 09";
      ok = false;
    }

    const address = addressForm.address?.trim() || "";
    if (!address) {
      e.address = "Địa chỉ chi tiết không được để trống";
      ok = false;
    } else if (address.length < 5) {
      e.address = "Địa chỉ chi tiết phải có ít nhất 5 ký tự";
      ok = false;
    }

    if (!addressForm.provinceId) {
      e.provinceId = "Vui lòng chọn tỉnh/thành phố";
      ok = false;
    }
    if (!addressForm.districtId) {
      e.districtId = "Vui lòng chọn quận/huyện";
      ok = false;
    }
    if (!addressForm.wardCode) {
      e.wardCode = "Vui lòng chọn phường/xã";
      ok = false;
    }

    setErrors(e);
    return ok;
  };

  const openAdd = () => {
    setEditingAddressId(null);
    setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
    setDistricts([]);
    setWards([]);
    setErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
    setShowModal(true);
  };

  const openEdit = async (addr) => {
    const provinceId = toNumberOrNull(addr.provinceId);
    const districtId = toNumberOrNull(addr.districtId);
    const wardCode = addr.wardCode ?? null;

    // preload districts/wards
    if (provinceId) {
      setLoadingAddress((p) => ({ ...p, district: true }));
      try {
        const res = await axios.get(urlDistricts, {
          params: { province_id: provinceId },
          headers: { token: tokenApiGHN },
        });
        setDistricts(res.data?.data || []);
      } catch (e) {
        console.error(e);
        setDistricts([]);
      } finally {
        setLoadingAddress((p) => ({ ...p, district: false }));
      }
    }

    if (districtId) {
      setLoadingAddress((p) => ({ ...p, ward: true }));
      try {
        const res = await axios.get(urlWard, {
          params: { district_id: districtId },
          headers: { token: tokenApiGHN },
        });
        setWards(res.data?.data || []);
      } catch (e) {
        console.error(e);
        setWards([]);
      } finally {
        setLoadingAddress((p) => ({ ...p, ward: false }));
      }
    }

    setEditingAddressId(addr.id);
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || "",
      address: addr.diaChiChiTiet || "",
      provinceId: provinceId || null,
      districtId: districtId || null,
      wardCode: wardCode,
    });

    setErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
    setShowModal(true);
  };

  const submitAdd = async () => {
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }
    if (!taiKhoanId) {
      toast.error("Không tìm thấy id tài khoản!");
      return;
    }

    try {
      setAddressLoading(true);

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
      toast.success("Thêm địa chỉ thành công!");
      await fetchAddresses();

      setShowModal(false);
      setEditingAddressId(null);
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Thêm địa chỉ thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const submitUpdate = async () => {
    if (!validate()) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    Modal.confirm({
      title: "Xác nhận cập nhật",
      content: "Bạn có chắc chắn muốn cập nhật địa chỉ này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: async () => {
        try {
          setAddressLoading(true);

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
          toast.success("Cập nhật địa chỉ thành công!");
          await fetchAddresses();

          setShowModal(false);
          setEditingAddressId(null);
        } catch (e) {
          console.error(e);
          toast.error(e?.message || "Cập nhật địa chỉ thất bại!");
        } finally {
          setAddressLoading(false);
        }
      },
    });
  };

  const del = (addressId) => {
    Modal.confirm({
      title: "Xóa địa chỉ",
      content: "Bạn có chắc chắn muốn xóa địa chỉ này?",
      okText: "Xóa",
      cancelText: "Hủy",
      okType: "danger",
      centered: true,
      onOk: async () => {
        try {
          setAddressLoading(true);
          await userService.deleteAddress(addressId);
          toast.success("Xóa địa chỉ thành công!");
          await fetchAddresses();
        } catch (e) {
          console.error(e);
          toast.success("Xóa địa chỉ thành công!");
        } finally {
          setAddressLoading(false);
        }
      },
    });
  };

  const setDefault = async (addressId) => {
    try {
      setAddressLoading(true);
      await userService.setDefaultAddress(addressId);
      toast.success("Đặt địa chỉ mặc định thành công!");
      await fetchAddresses();
    } catch (e) {
      console.error(e);
      toast.error(e?.message || "Đặt địa chỉ mặc định thất bại!");
    } finally {
      setAddressLoading(false);
    }
  };

  const title = useMemo(() => {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Địa chỉ</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
          Thêm địa chỉ mới
        </Button>
      </div>
    );
  }, []);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 12 }}>{title}</div>

      {addressLoading ? (
        <Spin />
      ) : (
        <div>
          {addresses.map((a) => (
            <div
              key={a.id}
              style={{
                border: a.isDefault ? "2px solid #1890ff" : "1px solid #e0e0e0",
                borderRadius: 8,
                padding: 16,
                marginBottom: 12,
                background: a.isDefault ? "#e6f7ff" : "#fff",
                boxShadow: a.isDefault ? "0 2px 8px rgba(24, 144, 255, 0.2)" : "none",
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                {a.isDefault && (
                  <Tag color="blue" style={{ marginBottom: 8, fontWeight: 600 }}>
                    Mặc định
                  </Tag>
                )}
                <div style={{ fontWeight: 600, marginBottom: 4, color: a.isDefault ? "#1890ff" : "#262626" }}>
                  {a.name}
                </div>
                <div style={{ color: "#595959", marginBottom: 4 }}>{a.phone}</div>
                <div style={{ color: "#595959" }}>
                  {a.diaChiChiTiet}, {a.wardName}, {a.districtName}, {a.provinceName}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                {!a.isDefault && (
                  <Button size="small" onClick={() => setDefault(a.id)}>
                    Đặt mặc định
                  </Button>
                )}
                <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(a)}>
                  Sửa
                </Button>
                <Button size="small" danger icon={<DeleteOutlined />} onClick={() => del(a.id)}>
                  Xóa
                </Button>
              </div>
            </div>
          ))}

          {addresses.length === 0 && (
            <div style={{ textAlign: "center", color: "#8c8c8c", padding: 40 }}>Chưa có địa chỉ nào</div>
          )}
        </div>
      )}

      <Modal
        title={editingAddressId ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingAddressId(null);
          setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
          setErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
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
                setAddressForm((p) => ({ ...p, name: e.target.value }));
                if (errors.name) setErrors((p) => ({ ...p, name: "" }));
              }}
              status={errors.name ? "error" : ""}
            />
            {errors.name && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.name}</div>}
          </div>

          <div>
            <Input
              placeholder="Số điện thoại"
              value={addressForm.phone}
              onChange={(e) => {
                setAddressForm((p) => ({ ...p, phone: e.target.value }));
                if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
              }}
              status={errors.phone ? "error" : ""}
            />
            {errors.phone && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.phone}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Tỉnh/Thành phố"
              value={addressForm.provinceId}
              onChange={(v) => {
                handleProvinceChange(v);
                if (errors.provinceId) setErrors((p) => ({ ...p, provinceId: "" }));
              }}
              loading={loadingAddress.province}
              style={{ width: "100%" }}
              status={errors.provinceId ? "error" : ""}
            >
              {provinces.map((p) => (
                <Option key={p.ProvinceID} value={p.ProvinceID}>
                  {p.ProvinceName}
                </Option>
              ))}
            </Select>
            {errors.provinceId && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.provinceId}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Quận/Huyện"
              value={addressForm.districtId}
              onChange={(v) => {
                handleDistrictChange(v);
                if (errors.districtId) setErrors((p) => ({ ...p, districtId: "" }));
              }}
              loading={loadingAddress.district}
              disabled={!addressForm.provinceId}
              style={{ width: "100%" }}
              status={errors.districtId ? "error" : ""}
            >
              {districts.map((d) => (
                <Option key={d.DistrictID} value={d.DistrictID}>
                  {d.DistrictName}
                </Option>
              ))}
            </Select>
            {errors.districtId && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.districtId}</div>}
          </div>

          <div>
            <Select
              placeholder="Chọn Xã/Phường"
              value={addressForm.wardCode}
              onChange={(v) => {
                setAddressForm((p) => ({ ...p, wardCode: v }));
                if (errors.wardCode) setErrors((p) => ({ ...p, wardCode: "" }));
              }}
              loading={loadingAddress.ward}
              disabled={!addressForm.districtId}
              style={{ width: "100%" }}
              status={errors.wardCode ? "error" : ""}
            >
              {wards.map((w) => (
                <Option key={w.WardCode} value={w.WardCode}>
                  {w.WardName}
                </Option>
              ))}
            </Select>
            {errors.wardCode && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.wardCode}</div>}
          </div>

          <div>
            <Input.TextArea
              placeholder="Địa chỉ cụ thể (số nhà, tên đường...)"
              value={addressForm.address}
              onChange={(e) => {
                setAddressForm((p) => ({ ...p, address: e.target.value }));
                if (errors.address) setErrors((p) => ({ ...p, address: "" }));
              }}
              rows={3}
              status={errors.address ? "error" : ""}
            />
            {errors.address && <div style={{ color: "#ff4d4f", marginTop: 6 }}>{errors.address}</div>}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <Button
              onClick={() => {
                setShowModal(false);
                setEditingAddressId(null);
                setAddressForm({ name: "", phone: "", address: "", provinceId: null, districtId: null, wardCode: null });
                setErrors({ name: "", phone: "", address: "", provinceId: "", districtId: "", wardCode: "" });
                setDistricts([]);
                setWards([]);
              }}
            >
              Hủy
            </Button>

            <Button type="primary" onClick={editingAddressId ? submitUpdate : submitAdd} loading={addressLoading}>
              {editingAddressId ? "Cập nhật" : "Thêm"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddressManager;
