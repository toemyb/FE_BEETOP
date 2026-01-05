import React, { useState, useEffect } from "react";
import { Form, Input, DatePicker, Radio, Button, Select, Row, Col, message, Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import userService from "../../service/userService";
import api from "../../service/api";
import { getGHNProvinces, getGHNDistricts, getGHNWards } from "../../service/ghnApi";

const { Option } = Select;

const removeAccents = (str) => {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
};

const EditNhanVienComponent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const [user, setUser] = useState(null);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    const fetchProvinces = async () => {
      setLoadingProvinces(true);
      try {
        const list = await getGHNProvinces();
        setProvinces(list);
      } catch (error) {
        message.error("Không thể tải danh sách tỉnh/thành phố (GHN)!");
      } finally {
        setLoadingProvinces(false);
      }
    };
    fetchProvinces();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        message.error("ID nhân viên không hợp lệ!");
        navigate("/admin/nhan-vien");
        return;
      }

      setLoading(true);
      try {
        // ⚠️ Bạn đang dùng endpoint address/customer cho nhân viên.
        // Nếu BE có endpoint riêng cho nhân viên, đổi lại ở đây.
        const [userRes, addressRes] = await Promise.all([
          userService.getUserDetail(id),
          api.get(`/api/admin/address/customer/${id}`).catch(() => ({ data: { data: [] } })),
        ]);

        const userData = userRes;
        const addresses = addressRes.data?.data || [];
        const defaultAddress = addresses.find((a) => a.macDinh) || addresses[0];

        setUser(userData);

        form.setFieldsValue({
          ten: userData.ten || "",
          email: userData.email || "",
          soDienThoai: userData.soDienThoai || "",
          ngaySinh: userData.ngaySinh ? moment(userData.ngaySinh, "YYYY-MM-DD") : null,
          gioiTinh: userData.gioiTinh || undefined,
          quocGia: "Việt Nam",
          diaChiChiTiet: defaultAddress?.diaChiChiTiet || "",
        });

        if (userData.anh) {
          setFileList([{ uid: "-1", name: "avatar.png", status: "done", url: userData.anh }]);
        }

        // ✅ Nếu có GHN IDs thì load districts/wards để set select đúng
        const provinceId = defaultAddress?.provinceId ? Number(defaultAddress.provinceId) : null;
        const districtId = defaultAddress?.districtId ? Number(defaultAddress.districtId) : null;
        const wardCode = defaultAddress?.wardCode ? String(defaultAddress.wardCode) : undefined;

        if (provinceId) {
          setLoadingDistricts(true);
          const dList = await getGHNDistricts(provinceId);
          setDistricts(dList);
          setLoadingDistricts(false);
        } else {
          setDistricts([]);
        }

        if (districtId) {
          setLoadingWards(true);
          const wList = await getGHNWards(districtId);
          setWards(wList);
          setLoadingWards(false);
        } else {
          setWards([]);
        }

        form.setFieldsValue({
          tinhThanh: provinceId || undefined,
          quanHuyen: districtId || undefined,
          phuongXa: wardCode || undefined,
        });
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu nhân viên:", error);
        message.error("Không thể tải dữ liệu nhân viên!");
        navigate("/admin/nhan-vien");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, form, navigate]);

  const handleProvinceChange = async (provinceId) => {
    setLoadingDistricts(true);
    try {
      const list = await getGHNDistricts(provinceId);
      setDistricts(list);
      setWards([]);
      form.setFieldsValue({ quanHuyen: undefined, phuongXa: undefined });
    } catch (error) {
      message.error("Không thể tải danh sách quận/huyện (GHN)!");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtId) => {
    setLoadingWards(true);
    try {
      const list = await getGHNWards(districtId);
      setWards(list);
      form.setFieldsValue({ phuongXa: undefined });
    } catch (error) {
      message.error("Không thể tải danh sách phường/xã (GHN)!");
    } finally {
      setLoadingWards(false);
    }
  };

  const filterOption = (input, option) => {
    const inputValue = removeAccents(input.toLowerCase());
    const optionValue = removeAccents((option?.children || "").toLowerCase());
    return optionValue.includes(inputValue);
  };

  const handleUpdate = async (values) => {
    setLoading(true);
    try {
      const province = provinces.find((p) => Number(p.ProvinceID) === Number(values.tinhThanh));
      const district = districts.find((d) => Number(d.DistrictID) === Number(values.quanHuyen));
      const ward = wards.find((w) => String(w.WardCode) === String(values.phuongXa));

      if (!province || !district || !ward) {
        message.error("Vui lòng chọn đầy đủ thông tin địa chỉ!");
        return;
      }

      const payload = {
        ten: values.ten,
        email: values.email,
        soDienThoai: values.soDienThoai,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format("YYYY-MM-DD") : null,
        gioiTinh: values.gioiTinh,
        quocGia: "Việt Nam",

        // ✅ text
        tinhThanh: province.ProvinceName,
        quanHuyen: district.DistrictName,
        phuongXa: ward.WardName,
        diaChiChiTiet: values.diaChiChiTiet,

        // ✅ GHN IDs
        provinceId: province.ProvinceID,
        districtId: district.DistrictID,
        wardCode: ward.WardCode,
      };

      const avatarFile = fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : null;

      console.log("Payload gửi đi:", payload);
      console.log("File ảnh:", avatarFile);

      const updatedUser = await userService.updateEmployee(id, payload, avatarFile);
      sessionStorage.setItem("user", JSON.stringify(updatedUser));

      message.success("Cập nhật nhân viên thành công!");
      navigate("/admin/nhan-vien");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      message.error(error?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isImage = file.type === "image/jpeg" || file.type === "image/png";
      if (!isImage) {
        message.error("Chỉ được tải lên file JPG hoặc PNG!");
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error("Kích thước ảnh phải nhỏ hơn 5MB!");
        return Upload.LIST_IGNORE;
      }
      setFileList([{ uid: file.uid, name: file.name, status: "done", url: URL.createObjectURL(file), originFileObj: file }]);
      return false;
    },
    fileList,
    accept: "image/jpeg,image/png",
    listType: "picture-circle",
    maxCount: 1,
  };

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ textAlign: "center", marginBottom: 24 }}>Cập nhật nhân viên</h2>

      {loading && !user ? (
        <div>Đang tải dữ liệu...</div>
      ) : (
        <Form form={form} onFinish={handleUpdate} layout="vertical" style={{ maxWidth: 1000, margin: "0 auto" }}>
          <Row gutter={24}>
            <Col span={4} style={{ textAlign: "center" }}>
              <Form.Item name="anh" label="Ảnh đại diện">
                <Upload {...uploadProps}>
                  {fileList.length < 1 && (
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: "50%",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlusOutlined />
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>

            <Col span={20}>
              <Form.Item
                name="ten"
                label="Họ và tên"
                rules={[
                  { required: true, message: "Vui lòng nhập Họ và tên!" },
                  { pattern: /^[\p{L} ]+$/u, message: "Họ và tên chỉ chứa chữ cái và khoảng trắng!" },
                ]}
              >
                <Input placeholder="Họ và tên" disabled={loading} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="ngaySinh"
                    label="Ngày sinh"
                    rules={[
                      { required: true, message: "Vui lòng chọn Ngày sinh!" },
                      {
                        validator: (_, value) => {
                          if (!value || !value.isValid?.()) return Promise.reject("Vui lòng chọn ngày hợp lệ!");
                          const today = moment().startOf("day");
                          const birthday = value.clone().startOf("day");
                          if (birthday.isAfter(today)) return Promise.reject("Ngày sinh không được lớn hơn ngày hiện tại!");
                          const eighteenYearsAgo = today.clone().subtract(18, "years");
                          if (birthday.isAfter(eighteenYearsAgo)) return Promise.reject("Phải từ 18 tuổi trở lên!");
                          const oneHundredYearsAgo = today.clone().subtract(100, "years");
                          if (birthday.isBefore(oneHundredYearsAgo)) return Promise.reject("Tuổi không được quá 100!");
                          return Promise.resolve();
                        },
                      },
                    ]}
                  >
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} placeholder="Ngày sinh" disabled={loading} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="gioiTinh" label="Giới tính" rules={[{ required: true, message: "Vui lòng chọn Giới tính!" }]}>
                    <Radio.Group disabled={loading}>
                      <Radio value="Nam">Nam</Radio>
                      <Radio value="Nữ">Nữ</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="soDienThoai"
                    label="Số điện thoại"
                    rules={[
                      { required: true, message: "Vui lòng nhập SĐT!" },
                      { pattern: /^0\d{9}$/, message: "SĐT phải bắt đầu bằng 0 và gồm 10 chữ số!" },
                    ]}
                  >
                    <Input placeholder="Số điện thoại" disabled={loading} />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Vui lòng nhập Email!" },
                      { type: "email", message: "Email không hợp lệ!" },
                    ]}
                  >
                    <Input placeholder="Email" disabled={loading} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="quocGia" label="Quốc gia" initialValue="Việt Nam">
                <Input value="Việt Nam" disabled />
              </Form.Item>

              <Form.Item
                name="diaChiChiTiet"
                label="Địa chỉ chi tiết"
                rules={[{ required: true, message: "Vui lòng nhập địa chỉ chi tiết!" }]}
              >
                <Input placeholder="Địa chỉ chi tiết" disabled={loading} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="tinhThanh" label="Tỉnh/Thành phố" rules={[{ required: true, message: "Chọn Tỉnh/Thành phố!" }]}>
                    <Select
                      showSearch
                      placeholder="Gõ để tìm kiếm Tỉnh/Thành phố"
                      onChange={handleProvinceChange}
                      filterOption={filterOption}
                      loading={loadingProvinces}
                      disabled={loading || loadingProvinces}
                    >
                      {provinces.map((p) => (
                        <Option key={p.ProvinceID} value={p.ProvinceID}>
                          {p.ProvinceName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="quanHuyen" label="Quận/Huyện" rules={[{ required: true, message: "Chọn Quận/Huyện!" }]}>
                    <Select
                      showSearch
                      placeholder="Gõ để tìm kiếm Quận/Huyện"
                      onChange={handleDistrictChange}
                      disabled={loading || loadingDistricts || !districts.length}
                      filterOption={filterOption}
                      loading={loadingDistricts}
                    >
                      {districts.map((d) => (
                        <Option key={d.DistrictID} value={d.DistrictID}>
                          {d.DistrictName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item name="phuongXa" label="Phường/Xã" rules={[{ required: true, message: "Chọn Phường/Xã!" }]}>
                    <Select
                      showSearch
                      placeholder="Gõ để tìm kiếm Phường/Xã"
                      disabled={loading || loadingWards || !wards.length}
                      filterOption={filterOption}
                      loading={loadingWards}
                    >
                      {wards.map((w) => (
                        <Option key={w.WardCode} value={w.WardCode}>
                          {w.WardName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item style={{ textAlign: "center" }}>
                <Button type="primary" htmlType="submit" style={{ minWidth: 120 }} loading={loading} disabled={loading}>
                  Cập nhật
                </Button>
                <Button onClick={() => navigate("/admin/nhan-vien")} style={{ marginLeft: 8 }} disabled={loading}>
                  Hủy
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      )}
    </div>
  );
};

export default EditNhanVienComponent;
