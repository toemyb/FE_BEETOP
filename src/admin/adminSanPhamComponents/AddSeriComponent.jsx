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
  Upload,
  Modal,
} from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { PlusOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import {
  addListSeri,
  getSeriByLaptopCt,
  extractBeMessage,
  checkSeriExists,
} from "../../service/SeriService";

const { Option } = Select;

const AddSeriComponent = ({ idLaptopCt: propIdLaptopCt, onClose }) => {
  const params = useParams();
  const navigate = useNavigate();

  const idLaptopCt = propIdLaptopCt || params.idLaptopCt;

  const [rows, setRows] = useState([]);
  const [serialInput, setSerialInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [currentCount, setCurrentCount] = useState(0);

  // import excel states (local)
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  const SERI_ACTIVE = 1;
  const SERI_PENDING = 2;
  const SERI_SOLD = 3;

  const SERI_LEN = 10;

  const normalizeSeri = (s) => (s || "").trim().toUpperCase();
  const isValidSeri = (seri) => normalizeSeri(seri).length === SERI_LEN;

  const fetchCount = async () => {
    try {
      const res = await getSeriByLaptopCt(idLaptopCt);
      const list = res?.data?.data || res?.data || [];
      setCurrentCount(Array.isArray(list) ? list.length : 0);
    } catch (e) {
      console.error("Lỗi load seri:", e);
    }
  };

  // check tồn tại trong hệ thống
  const existsInSystem = async (idSeri) => {
    const res = await checkSeriExists(idSeri);
    const data = res?.data;
    if (typeof data === "boolean") return data;
    if (typeof data?.data === "boolean") return data.data;
    if (typeof data?.data?.data === "boolean") return data.data.data;
    return false;
  };

  useEffect(() => {
    if (!idLaptopCt) {
      message.error("Không tìm thấy idLaptopCt.");
      if (onClose) onClose();
      else navigate(-1);
      return;
    }
    fetchCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLaptopCt]);

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

  // ========== ADD FROM TEXTAREA ==========
  const handleAddFromInput = async () => {
    if (!serialInput.trim())
      return message.warning("Nhập ít nhất 1 serial number.");

    const tokens = serialInput
      .split(/[\n,;]+/)
      .map((s) => normalizeSeri(s))
      .filter(Boolean);

    if (!tokens.length) return message.warning("Không tìm thấy serial hợp lệ.");

    const invalid = tokens.filter((x) => x.length !== SERI_LEN);
    if (invalid.length) {
      return message.error(
        `Seri chỉ dài ${SERI_LEN} ký tự: ${invalid.join(", ")}`
      );
    }

    const uniqTokens = [...new Set(tokens)];

    try {
      setSubmitting(true);
      const existedInSystem = [];
      const okToAdd = [];

      for (const id of uniqTokens) {
        const exists = await existsInSystem(id);
        if (exists) existedInSystem.push(id);
        else okToAdd.push(id);
      }

      if (existedInSystem.length) {
        message.error(
          `Seri đã tồn tại trong hệ thống: ${existedInSystem.join(", ")}`
        );
      }
      if (!okToAdd.length) return;

      setRows((prev) => {
        const existed = new Set(prev.map((r) => normalizeSeri(r.idSeri)));
        const next = [...prev];
        okToAdd.forEach((id) => {
          if (!existed.has(id)) {
            next.push({ idSeri: id, trangThai: SERI_ACTIVE });
            existed.add(id);
          }
        });
        return next;
      });

      setSerialInput("");
    } catch (e) {
      console.error("❌ Lỗi check tồn tại seri:", e);
      message.error(extractBeMessage(e) || "Lỗi không xác định.");
    } finally {
      setSubmitting(false);
    }
  };

  // ========== IMPORT EXCEL (LOCAL ONLY) ==========
  const parseExcelFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const wb = XLSX.read(buffer, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) return [];

    // lấy raw rows dạng array-of-array
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    // aoa[0] là header, dữ liệu từ dòng 2
    return aoa.slice(1);
  };

  const handleImportExcelLocal = async (file) => {
    if (!file) return;

    setImportResult(null);

    try {
      setImporting(true);

      const dataRows = await parseExcelFile(file);

      const errors = [];
      const fileSeriSeen = new Set();
      const existedInTable = new Set(rows.map((r) => normalizeSeri(r.idSeri)));

      const candidates = [];

      // ✅ chạy tuần tự vì có await existsInSystem
      for (let idx = 0; idx < dataRows.length; idx++) {
        const r = dataRows[idx];
        const excelRowIndex = idx + 2; // row hiển thị theo Excel (tính cả header)

        const rawSeri = r?.[0] ?? "";
        const rawTrangThai = r?.[1] ?? "";

        // ✅ FIX: nếu cả 2 cột đều rỗng => bỏ qua (không báo lỗi “Thiếu mã seri”)
        if (
          String(rawSeri).trim() === "" &&
          String(rawTrangThai).trim() === ""
        ) {
          continue;
        }

        const idSeri = normalizeSeri(String(rawSeri));

        if (!idSeri) {
          errors.push({
            rowIndex: excelRowIndex,
            idSeri: "",
            message: "Thiếu mã seri",
          });
          continue;
        }

        if (idSeri.length !== SERI_LEN) {
          errors.push({
            rowIndex: excelRowIndex,
            idSeri,
            message: `Seri phải đúng ${SERI_LEN} ký tự`,
          });
          continue;
        }

        if (fileSeriSeen.has(idSeri)) {
          errors.push({
            rowIndex: excelRowIndex,
            idSeri,
            message: "Seri bị trùng trong file",
          });
          continue;
        }
        fileSeriSeen.add(idSeri);

        if (existedInTable.has(idSeri)) {
          errors.push({
            rowIndex: excelRowIndex,
            idSeri,
            message: "Seri đã có trong danh sách bên dưới",
          });
          continue;
        }

        // ✅ CHECK TỒN TẠI TRONG DB: tồn tại thì KHÔNG đổ xuống bảng
        const existedInSystem = await existsInSystem(idSeri);
        if (existedInSystem) {
          errors.push({
            rowIndex: excelRowIndex,
            idSeri,
            message: "Seri đã tồn tại trong hệ thống",
          });
          continue;
        }

        let trangThai = SERI_ACTIVE;
        const tt = String(rawTrangThai).trim();
        if ([SERI_ACTIVE, SERI_PENDING, SERI_SOLD].includes(Number(tt))) {
          trangThai = Number(tt);
        }

        candidates.push({ idSeri, trangThai });
        existedInTable.add(idSeri);
      }

      // ✅ chỉ đổ các candidates hợp lệ xuống bảng
      setRows((prev) => [...prev, ...candidates]);

      // ✅ totalRows: chỉ tính số dòng “có nội dung” (không tính dòng rỗng)
      const nonEmptyTotal = dataRows.filter((r) => {
        const a = r?.[0] ?? "";
        const b = r?.[1] ?? "";
        return !(String(a).trim() === "" && String(b).trim() === "");
      }).length;

      const result = {
        totalRows: nonEmptyTotal,
        successCount: candidates.length,
        skippedCount: errors.length,
        errors,
      };

      setImportResult(result);
      message.success(`Đã đọc file: thêm ${candidates.length} seri hợp lệ`);

      if (errors.length) setImportModalOpen(true);
    } catch (e) {
      console.error("❌ Import local lỗi:", e);
      message.error("Không đọc được file Excel.");
    } finally {
      setImporting(false);
    }
  };

  // ========== SAVE ALL (CALL BE) ==========
  const handleSubmit = async () => {
    const cleaned = rows
      .map((r) => ({ ...r, idSeri: normalizeSeri(r.idSeri) }))
      .filter((r) => r.idSeri);

    if (!cleaned.length)
      return message.error("Chưa có serial number nào trong danh sách.");

    const invalid = cleaned
      .filter((r) => r.idSeri.length !== SERI_LEN)
      .map((r) => r.idSeri);
    if (invalid.length) {
      return message.error(
        `Seri chỉ dài ${SERI_LEN} ký tự: ${invalid.join(", ")}`
      );
    }

    const seen = new Set();
    const dup = [];
    cleaned.forEach((r) => {
      if (seen.has(r.idSeri)) dup.push(r.idSeri);
      else seen.add(r.idSeri);
    });
    if (dup.length) {
      return message.error(
        `Seri bị trùng trong danh sách: ${[...new Set(dup)].join(", ")}`
      );
    }

    const payload = {
      idLaptopCt,
      list: cleaned.map((r) => ({ idSeri: r.idSeri, trangThai: r.trangThai })),
    };

    try {
      setSubmitting(true);
      await addListSeri(payload);
      message.success("Thêm seri thành công.");
      await fetchCount();
      if (onClose) onClose();
      else navigate(-1);
    } catch (e) {
      console.error("❌ Lỗi thêm seri:", e);
      message.error(
        extractBeMessage(e) || "Không thể thêm seri (server trả về lỗi)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: "Serial Number",
      dataIndex: "idSeri",
      render: (val, record, index) => (
        <Input
          size="small"
          value={val}
          status={val && !isValidSeri(val) ? "error" : undefined}
          onChange={(e) => handleChangeRow(index, "idSeri", e.target.value)}
          placeholder={`VD: ABCD123456 (${SERI_LEN} ký tự)`}
        />
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 200,
    render: () => (  // ← Không cần dùng val/record/index nữa vì luôn cố định
      <div style={{ 
        padding: "2px 4px", 
        background: "#f6ffed", 
        border: "1px solid #b7eb8f", 
        borderRadius: "6px", 
        color: "#52c41a", 
        fontWeight: "500",
        textAlign: "center"
      }}>
        Có sẵn
      </div>
      ),
    },
    {
      title: "Hành động",
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

  const importErrorColumns = [
    { title: "Dòng", dataIndex: "rowIndex", width: 90 },
    { title: "Seri", dataIndex: "idSeri", width: 180 },
    { title: "Lỗi", dataIndex: "message" },
  ];

  return (
    <div style={{ padding: 24, display: "flex", justifyContent: "center" }}>
      <Card
        title="Quản lý Serial Numbers"
        style={{ width: "100%", maxWidth: 900 }}
      >
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

        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col span={18}>
            <div style={{ marginBottom: 4 }}>
              Thêm Serial Number
              <span style={{ color: "#888", marginLeft: 8 }}>
                (mỗi seri phải đúng {SERI_LEN} ký tự; cách nhau bằng dấu phẩy hoặc
                xuống dòng)
              </span>
            </div>
            <Input.TextArea
              rows={3}
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value)}
              placeholder="Ví dụ: ABCD123456, EFGH123456"
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
              loading={submitting}
              style={{ width: "100%" }}
            >
              Thêm vào danh sách
            </Button>
          </Col>
        </Row>

        {/* ✅ Import Excel LOCAL: chỉ đọc file và đổ xuống bảng */}
        <Row style={{ marginBottom: 16 }}>
          <Col span={24}>
            <div style={{ marginBottom: 4 }}>Import từ Excel:</div>

            <Upload
              accept=".xlsx,.xls"
              showUploadList={false}
              beforeUpload={(file) => {
                handleImportExcelLocal(file);
                return false;
              }}
              disabled={importing || submitting}
            >
              <Button icon={<UploadOutlined />} loading={importing}>
                Chọn file Excel
              </Button>
            </Upload>

            {importResult ? (
              <div style={{ marginTop: 10, color: "#555" }}>
                <b>Kết quả đọc file:</b> Tổng {importResult.totalRows} | Đổ xuống
                danh sách {importResult.successCount} | Lỗi/skip{" "}
                {importResult.skippedCount}{" "}
                {importResult.errors?.length ? (
                  <>
                    |{" "}
                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => setImportModalOpen(true)}
                    >
                      Xem lỗi ({importResult.errors.length})
                    </Button>
                  </>
                ) : null}
              </div>
            ) : null}
          </Col>
        </Row>

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
            onClick={() => (onClose ? onClose() : navigate(-1))}
            style={{ marginRight: 8 }}
            disabled={submitting || importing}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={submitting}
            disabled={importing}
          >
            Lưu
          </Button>
        </div>
      </Card>

      <Modal
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        footer={null}
        title="Lỗi khi đọc Excel"
        width={800}
      >
        <Table
          rowKey={(r, i) => `${r.rowIndex}-${r.idSeri || i}`}
          dataSource={importResult?.errors || []}
          columns={importErrorColumns}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </div>
  );
};

export default AddSeriComponent;
