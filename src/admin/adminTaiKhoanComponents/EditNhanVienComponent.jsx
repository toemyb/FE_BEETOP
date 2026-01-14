import React, { useState, useEffect } from "react";
import { Form, Input, DatePicker, Radio, Button, Select, Row, Col, Upload, Modal } from "antd";
import { toast } from "react-toastify";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import userService from "../../service/userService";
import api from "../../service/api";
import AddressManager from "../../components/AddressManager";
import 'react-toastify/dist/ReactToastify.css';
const EditNhanVienComponent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();

  const me = JSON.parse(sessionStorage.getItem("user") || "null");
  const myEmail = (me?.email || "").toLowerCase();

  // ✅ SỬA: isOwner không lấy từ sessionStorage.idTaiKhoan nữa (vì thiếu field)
  const [isOwner, setIsOwner] = useState(false);

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);

  // ✅ NEW: địa chỉ mặc định lấy từ AddressManager
  const [defaultAddress, setDefaultAddress] = useState(null);

  // ✅ SỬA: xác định owner bằng cách match email trong list ADMIN (có idTaiKhoan)
  useEffect(() => {
    (async () => {
      try {
        const adminRes = await api.get("/api/admin/users/by-role/R001");
        const admins = adminRes.data?.data || [];
        const meInAdmins = admins.find((u) => (u?.email || "").toLowerCase() === myEmail);
        setIsOwner(((meInAdmins?.idTaiKhoan || "")).toUpperCase() === "AD000");
      } catch (e) {
        setIsOwner(false);
      }
    })();
  }, [myEmail]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) {
        toast.error("ID nhân viên không hợp lệ!");
        navigate("/admin/nhan-vien");
        return;
      }

      setLoading(true);
      try {
        const [userRes, addressRes] = await Promise.all([
          userService.getUserDetail(id),
          api.get(`/api/admin/address/customer/${id}`).catch(() => ({ data: { data: [] } })),
        ]);

        const userData = userRes;
        const addresses = addressRes.data?.data || [];
        const addr = addresses.find((a) => a.macDinh) || addresses[0] || null;

        // ✅ set defaultAddress (fallback names từ data cũ)
        if (addr) {
          setDefaultAddress({
            ...addr,
            provinceName: addr.provinceName || addr.tinhThanh || "",
            districtName: addr.districtName || addr.quanHuyen || "",
            wardName: addr.wardName || addr.phuongXa || "",
          });
        } else {
          setDefaultAddress(null);
        }

        setUser(userData);
        const currentRole =
          (userData?.tenChucVu || "").toString().toUpperCase() ||
          (userData?.idRole?.idRole === "R001" ? "ADMIN" : "NHAN_VIEN");

        form.setFieldsValue({
          ten: userData.ten || "",
          email: userData.email || "",
          soDienThoai: userData.soDienThoai || "",
          ngaySinh: userData.ngaySinh ? moment(userData.ngaySinh, "YYYY-MM-DD") : null,
          role: currentRole === "ADMIN" ? "ADMIN" : "NHAN_VIEN",
          gioiTinh: userData.gioiTinh || undefined,
          quocGia: "Việt Nam",
        });

        if (userData.anh) {
          setFileList([{ uid: "-1", name: "avatar.png", status: "done", url: userData.anh }]);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu nhân viên:", error);
        toast.error("Không thể tải dữ liệu nhân viên!");
        navigate("/admin/nhan-vien");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, form, navigate]);

  const doUpdate = async (values) => {
    setLoading(true);
    try {
      if (values.role === "ADMIN" && !isOwner) {
        toast.error("Chỉ tài khoản chủ (AD000) được cập nhật/chuyển ADMIN.");
        return;
      }

      // ✅ LẤY ĐỊA CHỈ TỪ AddressManager
      if (!defaultAddress) {
        toast.error("Chưa có địa chỉ mặc định. Vui lòng thêm/đặt mặc định trước!");
        return;
      }

      const provinceId = defaultAddress.provinceId ? Number(defaultAddress.provinceId) : null;
      const districtId = defaultAddress.districtId ? Number(defaultAddress.districtId) : null;
      const wardCode = defaultAddress.wardCode ? String(defaultAddress.wardCode) : null;

      if (!provinceId || !districtId || !wardCode) {
        toast.error("Địa chỉ mặc định đang thiếu mã GHN. Vui lòng bấm Sửa địa chỉ và chọn lại Tỉnh/Huyện/Xã!");
        return;
      }

      const payload = {
        ten: values.ten,
        email: values.email,
        soDienThoai: values.soDienThoai,
        ngaySinh: values.ngaySinh ? values.ngaySinh.format("YYYY-MM-DD") : null,
        gioiTinh: values.gioiTinh,
        quocGia: "Việt Nam",

        // ✅ text hiển thị
        tinhThanh: defaultAddress.provinceName || defaultAddress.tinhThanh || "",
        quanHuyen: defaultAddress.districtName || defaultAddress.quanHuyen || "",
        phuongXa: defaultAddress.wardName || defaultAddress.phuongXa || "",
        diaChiChiTiet: defaultAddress.diaChiChiTiet || defaultAddress.address || defaultAddress.diaChi || "",

        // ✅ GHN IDs
        provinceId,
        districtId,
        wardCode,
      };

      const avatarFile = fileList.length > 0 && fileList[0].originFileObj ? fileList[0].originFileObj : null;

      console.log("Payload gửi đi:", payload);
      console.log("File ảnh:", avatarFile);

      const updatedUser =
        values.role === "ADMIN"
          ? await userService.updateAdmin(id, payload, avatarFile)
          : await userService.updateEmployee(id, payload, avatarFile);

      // ✅ SỬA: cập nhật sessionStorage đúng user + merge để không mất field
      const oldMe = JSON.parse(sessionStorage.getItem("user") || "null");
      const sameUser =
        (oldMe?.email && updatedUser?.email && oldMe.email.toLowerCase() === updatedUser.email.toLowerCase()) ||
        (oldMe?.idTaiKhoan && updatedUser?.idTaiKhoan &&
          String(oldMe.idTaiKhoan).toUpperCase() === String(updatedUser.idTaiKhoan).toUpperCase());

      if (sameUser) {
        sessionStorage.setItem("user", JSON.stringify({ ...oldMe, ...updatedUser }));
      }

      toast.success("Cập nhật nhân viên thành công!");
      navigate("/admin/nhan-vien");
    } catch (error) {
      console.error("Lỗi khi cập nhật:", error);
      toast.error(error?.message || "Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (values) => {
    Modal.confirm({
      title: "Xác nhận cập nhật",
      content: "Bạn có chắc muốn lưu thay đổi nhân viên này không?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: () => doUpdate(values),
    });
  };

  const uploadProps = {
    onRemove: () => setFileList([]),
    beforeUpload: (file) => {
      const isImage = file.type === "image/jpeg" || file.type === "image/png";
      if (!isImage) {
        toast.error("Chỉ được tải lên file JPG hoặc PNG!");
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        toast.error("Kích thước ảnh phải nhỏ hơn 5MB!");
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
                <Col span={8}>
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
                    <DatePicker
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                      placeholder="Ngày sinh"
                      disabled={loading}
                    />
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="role"
                    label="Chức vụ"
                    initialValue="NHAN_VIEN"
                    rules={[{ required: true, message: "Vui lòng chọn chức vụ!" }]}
                  >
                    <Select disabled={loading || !isOwner}>
                      <Select.Option value="NHAN_VIEN">Nhân viên</Select.Option>
                      <Select.Option value="ADMIN">Admin</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col span={8}>
                  <Form.Item
                    name="gioiTinh"
                    label="Giới tính"
                    rules={[{ required: true, message: "Vui lòng chọn Giới tính!" }]}
                  >
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

              {/* ✅ NEW: quản lý địa chỉ như AdminProfile */}
              <AddressManager
                taiKhoanId={id}
                onDefaultChange={(addr) => setDefaultAddress(addr)}
              />

              <Form.Item style={{ textAlign: "center", marginTop: 16 }}>
                <Button type="primary" htmlType="submit" style={{ minWidth: 120 }} loading={loading} disabled={loading}>
                  Cập nhật
                </Button>
                <Button
                  onClick={() =>
                    Modal.confirm({
                      title: "Xác nhận hủy",
                      content: "Bạn có chắc muốn rời trang? Thay đổi sẽ không được lưu.",
                      okText: "Rời trang",
                      cancelText: "Ở lại",
                      centered: true,
                      onOk: () => navigate("/admin/nhan-vien"),
                    })
                  }
                  style={{ marginLeft: 8 }}
                  disabled={loading}
                >
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
