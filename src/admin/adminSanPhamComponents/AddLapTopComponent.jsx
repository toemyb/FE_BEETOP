import React, { useEffect, useState } from "react";
import {
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Card,
  message,
  Skeleton,
  Modal,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { addLaptop, getAllById, updateLaptop } from "../../service/LapTopService";
import {
  getAllManHinh,
  getAllPin,
  getAllKichThuoc,
  getAllHeDieuHanh,
  getAllThuongHieu,
} from "../../service/OptionService";

const { Option } = Select;

const AddLaptopForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const params = useParams();
  const idLaptop = params.idLaptop || params.id;
  const isEdit = !!idLaptop;

  const [brands, setBrands] = useState([]);
  const [screens, setScreens] = useState([]);
  const [pins, setPins] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [oses, setOses] = useState([]);

  const [saving, setSaving] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(isEdit);

  const pickList = (res) =>
    res?.data?.data?.content || res?.data?.content || res?.data || [];
  const pickObj = (res) => res?.data?.data || res?.data || {};

  // Load các option chọn
  useEffect(() => {
    (async () => {
      try {
        const [th, m, p, k, h] = await Promise.all([
          getAllThuongHieu(),
          getAllManHinh(),
          getAllPin(),
          getAllKichThuoc(),
          getAllHeDieuHanh(),
        ]);

        setBrands(pickList(th));
        setScreens(pickList(m));
        setPins(pickList(p));
        setSizes(
          pickList(k).map((i) => ({
            ...i,
            _label: `${i.chieuDai}x${i.chieuRong}x${i.chieuCao} - ${i.khoiLuong}kg`,
          }))
        );
        setOses(pickList(h));
      } catch (e) {
        console.error(e);
        message.error("Không tải được dữ liệu lựa chọn.");
      }
    })();
  }, []);

  // Load chi tiết khi Sửa
  useEffect(() => {
    if (!isEdit) {
      // form thêm mới: mặc định trạng thái = 1
      form.setFieldsValue({ trangThai: 1 });
      return;
    }

    (async () => {
      try {
        const res = await getAllById(idLaptop); // GET /api/laptop/detail/:id
        const item = pickObj(res);
        form.setFieldsValue({
          tenSanPham: item.tenSanPham,
          moTa: item.moTa,
          idThuongHieu: item.idThuongHieu,
          idManHinh: item.idManHinh,
          idPin: item.idPin,
          idKichThuoc: item.idKichThuoc,
          idHeDieuHanh: item.idHeDieuHanh,
          trangThai: item.trangThai ?? 1, // ✅ load trạng thái
        });
      } catch (e) {
        console.error(e);
        message.error("Không tải được chi tiết sản phẩm.");
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [isEdit, idLaptop, form]);

  // Hàm thực sự gọi API (thêm / sửa)
  const doSubmit = async (values) => {
    const payload = {
      tenSanPham: values.tenSanPham,
      moTa: values.moTa || "",
      idThuongHieu: values.idThuongHieu,
      idManHinh: values.idManHinh,
      idPin: values.idPin,
      idKichThuoc: values.idKichThuoc,
      idHeDieuHanh: values.idHeDieuHanh,
      trangThai: Number(values.trangThai ?? 1), // ✅ gửi trạng thái
    };

    try {
      setSaving(true);
      if (isEdit) {
        const res = await updateLaptop(idLaptop, payload);
        if (res?.data?.code === 200)
          message.success(res.data.message || "Cập nhật laptop thành công");
        else message.success("Cập nhật laptop thành công");
      } else {
        const res = await addLaptop(payload);
        if (res?.data?.code === 200)
          message.success(res.data.message || "Thêm laptop thành công");
        else message.success("Thêm laptop thành công");
        form.resetFields();
        form.setFieldsValue({ trangThai: 1 });
      }
      navigate("/admin/lap-top");
    } catch (e) {
      console.error(e);
      message.error(
        isEdit ? "Không thể cập nhật laptop." : "Không thể thêm laptop."
      );
      throw e;
    } finally {
      setSaving(false);
    }
  };

  // Submit form: popup xác nhận rồi mới gọi doSubmit
  const onFinish = async (values) => {
    const name = values.tenSanPham || "(không tên)";
    if (isEdit) {
      Modal.confirm({
        title: "Xác nhận cập nhật",
        content: `Bạn có chắc chắn muốn cập nhật laptop "${name}"?`,
        okText: "Đồng ý",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSubmit(values),
      });
    } else {
      Modal.confirm({
        title: "Xác nhận thêm mới",
        content: `Bạn có chắc chắn muốn thêm laptop "${name}"?`,
        okText: "Đồng ý",
        cancelText: "Hủy",
        centered: true,
        onOk: () => doSubmit(values),
      });
    }
  };

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title={isEdit ? "SỬA SẢN PHẨM" : "THÊM SẢN PHẨM"}
        style={{ width: "100%", maxWidth: 1000 }}
      >
        {loadingDetail ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Form.Item
                  name="tenSanPham"
                  label="Tên Sản Phẩm"
                  rules={[{ required: true, message: "Nhập tên sản phẩm" }]}
                >
                  <Input placeholder="VD: Asus ZenBook Pro 14" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="moTa" label="Mô Tả">
                  <Input.TextArea
                    rows={1}
                    placeholder="Laptop mỏng nhẹ, hiệu năng cao..."
                  />
                </Form.Item>
              </Col>

              {/* Thương hiệu */}
              <Col span={6}>
                <Form.Item
                  name="idThuongHieu"
                  label="Thương Hiệu"
                  rules={[{ required: true, message: "Chọn thương hiệu" }]}
                >
                  <Select placeholder="Chọn thương hiệu">
                    {brands.map((i) => (
                      <Option key={i.id} value={i.id}>
                        {i.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Màn hình */}
              <Col span={6}>
                <Form.Item
                  name="idManHinh"
                  label="Màn Hình"
                  rules={[{ required: true, message: "Chọn màn hình" }]}
                >
                  <Select placeholder="Chọn màn hình">
                    {screens.map((i) => (
                      <Option key={i.id} value={i.id}>
                        {i.doPhanGiai || i.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Pin */}
              <Col span={6}>
                <Form.Item
                  name="idPin"
                  label="Pin"
                  rules={[{ required: true, message: "Chọn pin" }]}
                >
                  <Select placeholder="Chọn pin">
                    {pins.map((i) => (
                      <Option key={i.id} value={i.id}>
                        {i.dungLuong || i.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Kích thước */}
              <Col span={6}>
                <Form.Item
                  name="idKichThuoc"
                  label="Kích Thước"
                  rules={[{ required: true, message: "Chọn kích thước" }]}
                >
                  <Select placeholder="Chọn kích thước">
                    {sizes.map((i) => (
                      <Option key={i.id} value={i.id}>
                        {i._label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Hệ điều hành */}
              <Col span={6}>
                <Form.Item
                  name="idHeDieuHanh"
                  label="Hệ Điều Hành"
                  rules={[{ required: true, message: "Chọn hệ điều hành" }]}
                >
                  <Select placeholder="Chọn hệ điều hành">
                    {oses.map((i) => (
                      <Option key={i.id} value={i.id}>
                        {i.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* 🔥 Trạng thái */}
              <Col span={6}>
                <Form.Item
                  name="trangThai"
                  label="Trạng Thái"
                  rules={[{ required: true, message: "Chọn trạng thái" }]}
                  initialValue={1}
                >
                  <Select>
                    <Option value={1}>Hoạt động</Option>
                    <Option value={0}>Ngưng hoạt động</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                {isEdit ? "Lưu Thay Đổi" : "Lưu Sản Phẩm"}
              </Button>
              <Button
                style={{ marginLeft: 8 }}
                onClick={() => navigate("/admin/lap-top")}
              >
                Hủy
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default AddLaptopForm;