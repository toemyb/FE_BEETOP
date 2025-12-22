import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  message,
  Table,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { addListSeri, getSeriByLaptopCt } from "../../service/SeriService";

const { Option } = Select;

// nhận thêm props: idLaptopCt (từ modal) + onClose (callback đóng modal)
const AddSeriComponent = ({ idLaptopCt: propIdLaptopCt, onClose }) => {
  const params = useParams(); // dùng khi đi bằng route
  const navigate = useNavigate();

  const idLaptopCt = propIdLaptopCt || params.idLaptopCt; // ưu tiên props

  const [rows, setRows] = useState([]); // danh sách seri đang nhập
  const [serialInput, setSerialInput] = useState(""); // ô nhập nhiều seri 1 lúc
  const [submitting, setSubmitting] = useState(false);
  const [currentCount, setCurrentCount] = useState(0);

  const SERI_ACTIVE = 1;
const SERI_PENDING = 2;
const SERI_SOLD = 3;

  // Load số seri hiện có (optional)
  useEffect(() => {
    if (!idLaptopCt) {
      message.error("Không tìm thấy idLaptopCt.");
      if (onClose) onClose();
      else navigate(-1);
      return;
    }

    const fetchCount = async () => {
      try {
        const res = await getSeriByLaptopCt(idLaptopCt);
        const list = res?.data?.data || res?.data || [];
        setCurrentCount(Array.isArray(list) ? list.length : 0);
      } catch (e) {
        console.error("Lỗi load seri:", e);
      }
    };

    fetchCount();
  }, [idLaptopCt, navigate, onClose]);

  const handleChangeRow = (index, field, value) => {
    setRows((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const handleRemoveRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // Thêm từ ô nhập "nhiều serial cùng lúc"
  const handleAddFromInput = () => {
    if (!serialInput.trim()) {
      return message.warning("Nhập ít nhất 1 serial number.");
    }

    // tách theo dấu phẩy, xuống dòng, chấm phẩy
    const tokens = serialInput
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!tokens.length) {
      return message.warning("Không tìm thấy serial hợp lệ.");
    }

    setRows((prev) => {
      const existed = new Set(prev.map((r) => r.idSeri));
      const next = [...prev];

      tokens.forEach((id) => {
        if (!existed.has(id)) {
          next.push({ idSeri: id, trangThai: 1 });
          existed.add(id);
        }
      });

      return next;
    });

    setSerialInput("");
  };

  const handleSubmit = async () => {
    const cleanedList = rows
      .map((r) => ({ ...r, idSeri: (r.idSeri || "").trim() }))
      .filter((r) => r.idSeri);

    if (!cleanedList.length) {
      return message.error("Chưa có serial number nào trong danh sách.");
    }

    const payload = {
      idLaptopCt,
      list: cleanedList,
    };

    console.log("📤 ADD LIST SERI PAYLOAD:", payload);

    try {
      setSubmitting(true);
      await addListSeri(payload);
      message.success("Thêm seri thành công.");
      if (onClose) onClose();
      else navigate(-1); // hoặc điều hướng về /admin/lap-top-ct/:idLaptop
    } catch (e) {
      console.error("❌ Lỗi thêm seri:", e);
      message.error("Không thể thêm seri (server trả về lỗi).");
    } finally {
      setSubmitting(false);
    }
  };

  // Cột bảng danh sách serial
  const columns = [
    {
      title: "Serial Number",
      dataIndex: "idSeri",
      render: (val, record, index) => (
        <Input
          size="small"
          value={val}
          onChange={(e) => handleChangeRow(index, "idSeri", e.target.value)}
          placeholder="VD: LAP202400007"
        />
      ),
    },
     {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 200,
      render: (val, record, index) => (
        <Select
          size="small"
          value={val}
          style={{ width: "100%" }}
          onChange={(v) => handleChangeRow(index, "trangThai", v)}
        >
          <Option value={SERI_ACTIVE}>ACTIVE - Có sẵn</Option>
          <Option value={SERI_PENDING}>PENDING - Tạm giữ</Option>
          <Option value={SERI_SOLD}>SOLD - Đã bán</Option>
        </Select>
      ),
    },
    {
      title: "Thao tác",
      width: 90,
      render: (_, __, index) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveRow(index)}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title="Quản lý Serial Numbers"
        style={{ width: "100%", maxWidth: 900 }}
      >
        {/* Thông tin biến thể */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <h4>Thông tin biến thể:</h4>
            <div>
              <b>ID biến thể:</b> {idLaptopCt}
            </div>
            <div>
              <b>Hiện đang có:</b> {currentCount} serial number
            </div>
          </Col>
        </Row>

        {/* Thêm serial number */}
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col span={18}>
            <div style={{ marginBottom: 4 }}>
              Thêm Serial Number
              <span style={{ color: "#888", marginLeft: 8 }}>
                (có thể nhập nhiều, cách nhau bằng dấu phẩy hoặc xuống dòng)
              </span>
            </div>
            <Input.TextArea
              rows={3}
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder="Ví dụ: LAP202400007, LAP202400008, LAP202400009"
            />
          </Col>
          <Col
            span={6}
            style={{ display: "flex", alignItems: "flex-end", marginTop: 4 }}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddFromInput}
              style={{ width: "100%" }}
            >
              Thêm vào danh sách
            </Button>
          </Col>
        </Row>

        {/* Import từ Excel (placeholder) */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <div style={{ marginBottom: 4 }}>Import từ Excel:</div>
            <Button
              style={{ marginRight: 8 }}
              onClick={() =>
                message.info("Chức năng import Excel sẽ làm sau nhé.")
              }
            >
              Chọn file Excel
            </Button>
            <Button
              type="link"
              onClick={() =>
                message.info("Chức năng tải mẫu Excel sẽ làm sau nhé.")
              }
            >
              Tải mẫu Excel
            </Button>
          </Col>
        </Row>

        {/* Danh sách serial numbers */}
        <Row style={{ marginBottom: 8 }}>
          <Col span={24}>
            <h4>Danh sách Serial Numbers:</h4>
          </Col>
        </Row>

        <Table
          rowKey={(record, index) => record.idSeri || index}
          dataSource={rows}
          columns={columns}
          pagination={false}
          locale={{ emptyText: "Chưa có serial number nào" }}
          size="small"
          bordered
        />

        <div style={{ textAlign: "right", marginTop: 16 }}>
          <Button
            onClick={() => {
              if (onClose) onClose();
              else navigate(-1);
            }}
            style={{ marginRight: 8 }}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
          >
            Lưu
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddSeriComponent;
