import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Select,
  InputNumber,
  Input,
  Button,
  message,
  Skeleton,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAllRam,
  getAllRom,
  getAllCpu,
  getAllDoHoa,
  getAllMauSac,
} from "../../service/OptionService";
import { getLaptopCTDetail, updateLaptopCT } from "../../service/LapTopCTService";

const { Option } = Select;

const EditLaptopCTComponent = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams(); // 👈 ID của biến thể (LaptopChiTiet)

  const [ramList, setRamList] = useState([]);
  const [ssdList, setSsdList] = useState([]);
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  const [colorList, setColorList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const pickList = (res) =>
    res?.data?.data?.content || res?.data?.content || res?.data || [];

  // ========== LOAD OPTIONS + DETAIL ==========
  useEffect(() => {
    if (!id) {
      message.error("Không tìm thấy ID biến thể!");
      navigate(-1);
      return;
    }

    const fetchAll = async () => {
      try {
        const [ramRes, ssdRes, cpuRes, gpuRes, colorRes, detailRes] =
          await Promise.all([
            getAllRam(),
            getAllRom(),
            getAllCpu(),
            getAllDoHoa(),
            getAllMauSac(),
            getLaptopCTDetail(id), // GET /api/laptop-ct/{id}
          ]);

        setRamList(pickList(ramRes));
        setSsdList(pickList(ssdRes));
        setCpuList(pickList(cpuRes));
        setGpuList(pickList(gpuRes));
        setColorList(pickList(colorRes));

        const dto = detailRes?.data?.data || detailRes?.data || {};

        form.setFieldsValue({
          idLaptopCT: dto.idLaptopCT,
          idRam: dto.idRam,
          idSsd: dto.idSsd,
          idCpu: dto.idCpu,
          idDohoa: dto.idDohoa,
          idMauSac: dto.idMauSac,
          giaBan: dto.giaBan != null ? Number(dto.giaBan) : 0, // đảm bảo là number
          moTa: dto.moTa,
          trangThai:
            dto.trangThai != null ? Number(dto.trangThai) : 1, // 1: kinh doanh
          ghiChu: dto.ghiChu,
        });
      } catch (e) {
        console.error("❌ Lỗi load chi tiết biến thể:", e);
        message.error("Không tải được dữ liệu biến thể.");
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [id, navigate, form]);

  // ========== SUBMIT UPDATE ==========
  const onFinish = async (values) => {
    const payload = {
      idLaptopCT: values.idLaptopCT,   // String
      idRam: values.idRam,            // UUID
      idSsd: values.idSsd,
      idCpu: values.idCpu,
      idDohoa: values.idDohoa,
      idMauSac: values.idMauSac,
      giaBan: Number(values.giaBan) || 0,
      moTa: values.moTa || "",
      trangThai: Number(values.trangThai) || 0,
      ghiChu: values.ghiChu || "",
    };

    try {
      setSaving(true);
      await updateLaptopCT(id, payload); // PUT /api/laptop-ct/{id}
      message.success("Cập nhật biến thể laptop thành công.");
      navigate(-1); // quay lại list biến thể
    } catch (e) {
      console.error("❌ Lỗi update biến thể:", e);
      message.error("Không thể cập nhật biến thể.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title="SỬA BIẾN THỂ LAPTOP"
        style={{ width: "100%", maxWidth: 900 }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Form.Item
                  name="idLaptopCT"
                  label="Mã biến thể"
                  rules={[{ required: true, message: "Nhập mã biến thể" }]}
                >
                  <Input placeholder="VD: laptopct1" maxLength={30} />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="giaBan"
                  label="Giá bán"
                  rules={[{ required: true, message: "Nhập giá bán" }]}
                >
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    step={100000}
                  />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="trangThai"
                  label="Trạng thái"
                  rules={[{ required: true, message: "Chọn trạng thái" }]}
                >
                  <Select>
                    <Option value={1}>Kinh doanh</Option>
                    <Option value={0}>Ngừng</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col span={24}>
                <Form.Item name="moTa" label="Mô tả">
                  <Input.TextArea rows={2} />
                </Form.Item>
              </Col>

              {/* RAM */}
              <Col span={8}>
                <Form.Item
                  name="idRam"
                  label="RAM"
                  rules={[{ required: true, message: "Chọn RAM" }]}
                >
                  <Select placeholder="Chọn RAM">
                    {ramList.map((r) => (
                      <Option key={r.id} value={r.id}>
                        {r.dungLuongRam || r.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* SSD */}
              <Col span={8}>
                <Form.Item
                  name="idSsd"
                  label="SSD"
                  rules={[{ required: true, message: "Chọn SSD" }]}
                >
                  <Select placeholder="Chọn SSD">
                    {ssdList.map((s) => (
                      <Option key={s.id} value={s.id}>
                        {s.dungLuongSsd || s.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* CPU */}
              <Col span={8}>
                <Form.Item
                  name="idCpu"
                  label="CPU"
                  rules={[{ required: true, message: "Chọn CPU" }]}
                >
                  <Select placeholder="Chọn CPU">
                    {cpuList.map((c) => (
                      <Option key={c.id} value={c.id}>
                        {c.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Đồ họa */}
              <Col span={8}>
                <Form.Item
                  name="idDohoa"
                  label="Đồ họa"
                  rules={[{ required: true, message: "Chọn Đồ họa" }]}
                >
                  <Select placeholder="Chọn Đồ họa">
                    {gpuList.map((g) => (
                      <Option key={g.id} value={g.id}>
                        {g.tenDayDu || g.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {/* Màu sắc */}
              <Col span={8}>
                <Form.Item
                  name="idMauSac"
                  label="Màu sắc"
                  rules={[{ required: true, message: "Chọn Màu sắc" }]}
                >
                  <Select placeholder="Chọn màu">
                    {colorList.map((m) => (
                      <Option key={m.id} value={m.id}>
                        {m.ten}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item name="ghiChu" label="Ghi chú">
                  <Input />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={saving}>
                Lưu thay đổi
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={() => navigate(-1)}>
                Hủy
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </div>
  );
};

export default EditLaptopCTComponent;
