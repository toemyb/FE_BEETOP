import React, { useEffect, useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Select,
  InputNumber,
  Input,
  Button,
  message,
  Table,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  getAllRam,
  getAllRom,
  getAllCpu,
  getAllDoHoa,
  getAllMauSac,
} from "../../service/OptionService";
import { autoGenerateLaptopCT } from "../../service/LapTopCTService";

const { Option } = Select;

const AddLaptopCTAutoGenComponent = () => {
  const navigate = useNavigate();
  const { idLaptop } = useParams(); // /admin/lap-top-ct/add/:idLaptop

  const [ramList, setRamList] = useState([]);
  const [ssdList, setSsdList] = useState([]);
  const [cpuList, setCpuList] = useState([]);
  const [gpuList, setGpuList] = useState([]);
  const [colorList, setColorList] = useState([]);

  // field chung
  const [idLaptopCT, setIdLaptopCT] = useState("laptopct");
  const [giaBan, setGiaBan] = useState(0);
  const [moTa, setMoTa] = useState("Chi tiết laptop test tự sinh");
  const [trangThai, setTrangThai] = useState(1);
  const [ghiChu, setGhiChu] = useState("auto-generate");

  // list ID được chọn
  const [selectedRams, setSelectedRams] = useState([]);
  const [selectedSsds, setSelectedSsds] = useState([]);
  const [selectedCpus, setSelectedCpus] = useState([]);
  const [selectedGpus, setSelectedGpus] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ========= LOAD OPTIONS =========
  useEffect(() => {
    if (!idLaptop) {
      message.error("Không tìm thấy ID laptop, quay lại danh sách.");
      navigate("/admin/lap-top");
      return;
    }

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [ramRes, ssdRes, cpuRes, gpuRes, colorRes] = await Promise.all([
          getAllRam(),
          getAllRom(),
          getAllCpu(),
          getAllDoHoa(),
          getAllMauSac(),
        ]);

        const pickList = (res) =>
          res?.data?.data?.content || res?.data?.content || res?.data || [];

        setRamList(pickList(ramRes));
        setSsdList(pickList(ssdRes));
        setCpuList(pickList(cpuRes));
        setGpuList(pickList(gpuRes));
        setColorList(pickList(colorRes));
      } catch (e) {
        console.error("❌ Lỗi load options:", e);
        message.error("Không tải được dữ liệu cấu hình.");
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();
  }, [idLaptop, navigate]);

  // ========= GEN TỔ HỢP ĐỂ XEM TRƯỚC (UI) =========
  const combinations = useMemo(() => {
    const rams = ramList.filter((x) => selectedRams.includes(x.id));
    const ssds = ssdList.filter((x) => selectedSsds.includes(x.id));
    const cpus = cpuList.filter((x) => selectedCpus.includes(x.id));
    const gpus = gpuList.filter((x) => selectedGpus.includes(x.id));
    const colors = colorList.filter((x) => selectedColors.includes(x.id));

    if (!rams.length || !ssds.length || !cpus.length || !gpus.length || !colors.length) {
      return [];
    }

    const result = [];
    let key = 1;
    for (const r of rams) {
      for (const s of ssds) {
        for (const c of cpus) {
          for (const g of gpus) {
            for (const m of colors) {
              result.push({
                key: key++,
                ram: r.dungLuongRam || r.ten,
                ssd: s.dungLuongSsd || s.ten,
                cpu: c.ten,
                gpu: g.tenDayDu || g.ten,
                color: m.ten,
              });
            }
          }
        }
      }
    }
    return result;
  }, [
    ramList,
    ssdList,
    cpuList,
    gpuList,
    colorList,
    selectedRams,
    selectedSsds,
    selectedCpus,
    selectedGpus,
    selectedColors,
  ]);

  const columnsPreview = [
    { title: "RAM", dataIndex: "ram" },
    { title: "SSD", dataIndex: "ssd" },
    { title: "CPU", dataIndex: "cpu" },
    { title: "Đồ họa", dataIndex: "gpu" },
    { title: "Màu sắc", dataIndex: "color" },
  ];

  // ========= SUBMIT: GỬI 1 LẦN VÀO AUTO-GEN =========
  const handleSubmit = async () => {
    if (!selectedRams.length) return message.error("Chọn ít nhất 1 RAM");
    if (!selectedSsds.length) return message.error("Chọn ít nhất 1 SSD");
    if (!selectedCpus.length) return message.error("Chọn ít nhất 1 CPU");
    if (!selectedGpus.length) return message.error("Chọn ít nhất 1 Đồ họa");
    if (!selectedColors.length) return message.error("Chọn ít nhất 1 Màu sắc");

    // khớp y DTO BE
    const payload = {
      idLaptop: idLaptop,                         // UUID string
      idLaptopCT: idLaptopCT || null,

      idRams: selectedRams,                       // List<UUID>
      idSsds: selectedSsds,
      idCpus: selectedCpus,
      idDohoas: selectedGpus,
      idMauSacs: selectedColors,

      giaBan: Number(giaBan) || 0,               // BigDecimal
      moTa,
      trangThai: Number(trangThai) || 0,         // Integer
      ghiChu,
    };

    console.log("📤 AUTO-GEN PAYLOAD GỬI LÊN:", payload);

    try {
      setSubmitting(true);
      await autoGenerateLaptopCT(payload);
      message.success("Tự sinh đầy đủ phiên bản thành công");
      navigate(`/admin/lap-top-ct/${idLaptop}`);
    } catch (e) {
      console.error("❌ Lỗi auto-gen:", e);
      message.error("Không thể tự sinh phiên bản (server trả về lỗi).");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title="THÊM PHIÊN BẢN "
        style={{ width: "100%", maxWidth: 1100 }}
        loading={loadingOptions}
      >
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Mã biến thể chung</div>
            <Input
              value={idLaptopCT}
              onChange={(e) => setIdLaptopCT(e.target.value)}
              placeholder="VD: laptopct4"
            />
          </Col>

          <Col span={4}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Giá bán</div>
            <InputNumber
              style={{ width: "100%" }}
              min={0}
              step={10000}
              value={giaBan}
              onChange={setGiaBan}
            />
          </Col>

          <Col span={4}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Trạng thái</div>
            <Select
              style={{ width: "100%" }}
              value={trangThai}
              onChange={setTrangThai}
            >
              <Option value={1}>Kinh doanh</Option>
              <Option value={0}>Ngừng</Option>
            </Select>
          </Col>

          <Col span={8}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Ghi chú</div>
            <Input value={ghiChu} onChange={(e) => setGhiChu(e.target.value)} />
          </Col>

          <Col span={24}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Mô tả</div>
            <Input.TextArea
              rows={2}
              value={moTa}
              onChange={(e) => setMoTa(e.target.value)}
            />
          </Col>

          {/* Chọn cấu hình */}
          <Col span={12}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Chọn RAM</div>
            <Select
              style={{ width: "100%" }}
              mode="multiple"
              placeholder="Chọn RAM"
              value={selectedRams}
              onChange={setSelectedRams}
            >
              {ramList.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.dungLuongRam || r.ten}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Chọn SSD</div>
            <Select
              style={{ width: "100%" }}
              mode="multiple"
              placeholder="Chọn SSD"
              value={selectedSsds}
              onChange={setSelectedSsds}
            >
              {ssdList.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.dungLuongSsd || s.ten}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Chọn CPU</div>
            <Select
              style={{ width: "100%" }}
              mode="multiple"
              placeholder="Chọn CPU"
              value={selectedCpus}
              onChange={setSelectedCpus}
            >
              {cpuList.map((c) => (
                <Option key={c.id} value={c.id}>
                  {c.ten}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Chọn Đồ họa</div>
            <Select
              style={{ width: "100%" }}
              mode="multiple"
              placeholder="Chọn GPU"
              value={selectedGpus}
              onChange={setSelectedGpus}
            >
              {gpuList.map((g) => (
                <Option key={g.id} value={g.id}>
                  {g.tenDayDu || g.ten}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={12}>
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Chọn Màu sắc</div>
            <Select
              style={{ width: "100%" }}
              mode="multiple"
              placeholder="Chọn màu"
              value={selectedColors}
              onChange={setSelectedColors}
            >
              {colorList.map((m) => (
                <Option key={m.id} value={m.id}>
                  {m.ten}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>

        <div style={{ marginTop: 24, marginBottom: 8, fontWeight: 600 }}>
          Các phiên bản sẽ được tạo ({combinations.length} bản):
        </div>
        <Table
          columns={columnsPreview}
          dataSource={combinations}
          size="small"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText:
              "Chọn đủ RAM, SSD, CPU, Đồ họa, Màu sắc để xem tổ hợp sẽ được tạo.",
          }}
        />

        <div style={{ marginTop: 16 }}>
          <Button onClick={() => navigate(`/admin/lap-top-ct/${idLaptop}`)}>
            Quay lại danh sách biến thể
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            loading={submitting}
            onClick={handleSubmit}
            disabled={!combinations.length}
          >
            Tự sinh đầy đủ phiên bản
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddLaptopCTAutoGenComponent;
