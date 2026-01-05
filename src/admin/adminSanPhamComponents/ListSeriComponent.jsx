// src/admin/adminLaptopCTComponents/ListSeriComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Table, Button, Modal, Tag, Space, message } from "antd";
import {
  QrcodeOutlined,
  PrinterOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useParams } from "react-router-dom";
import { getSeriByLaptopCt } from "../../service/SeriService";
import { QRCodeCanvas } from "qrcode.react";

// Map trạng thái giống AddSeriComponent
const SERI_ACTIVE = 1;
const SERI_PENDING = 2;
const SERI_SOLD = 3;

const SERI_STATUS = {
  [SERI_ACTIVE]: { text: "Có sẵn", color: "green" },
  [SERI_PENDING]: { text: "Tạm giữ", color: "gold" },
  [SERI_SOLD]: { text: "Đã bán", color: "red" },
};

const ListSeriComponent = ({ idLaptopCt: propIdLaptopCt }) => {
  const params = useParams();
  const idLaptopCt = propIdLaptopCt || params.idLaptopCt;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [currentSeri, setCurrentSeri] = useState(null);

  const fetchData = async () => {
    if (!idLaptopCt) {
      message.error("Không tìm thấy idLaptopCt để tải Serial.");
      return;
    }
    setLoading(true);
    try {
      const res = await getSeriByLaptopCt(idLaptopCt);
      const list = res?.data?.data || res?.data || [];
      const arr = Array.isArray(list) ? list : [];
      setData(
        arr.map((item, index) => ({
          ...item,
          _stt: index + 1,
        }))
      );
    } catch (e) {
      console.error("Lỗi load seri:", e);
      message.error("Không tải được danh sách serial.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idLaptopCt]);

  // ✅ đếm số seri theo trạng thái ACTIVE (1)
  const activeCount = useMemo(() => {
    return (data || []).filter((x) => Number(x?.trangThai) === SERI_ACTIVE).length;
  }, [data]);

  const openQrModal = (seri) => {
    setCurrentSeri(seri);
    setQrModalOpen(true);
  };

  const handlePrintQr = () => {
    const printContent = document.getElementById("qr-print-area").innerHTML;
    const win = window.open("", "", "width=600,height=600");
    win.document.write(printContent);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "_stt",
      width: 60,
    },
    {
      title: "Mã Seri",
      dataIndex: "idSeri",
      render: (val) => <strong>{val}</strong>,
    },
    {
      title: "Trạng thái",
      dataIndex: "trangThai",
      width: 180,
      render: (val) => {
        const item = SERI_STATUS[val] || {};
        return <Tag color={item.color}>{item.text || val}</Tag>;
      },
    },
    {
      title: "Hành động",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<QrcodeOutlined />}
            onClick={() => openQrModal(record)}
          >
            QR
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 8 }}>
        <strong>ID biến thể:</strong> {idLaptopCt}
      </div>

      {/* ✅ hiển thị số lượng ACTIVE */}
      <div style={{ marginBottom: 12 }}>
        <strong>Số seri ACTIVE (trạng thái 1):</strong> {activeCount}
      </div>

      <Button
        icon={<ReloadOutlined />}
        onClick={fetchData}
        style={{ marginBottom: 12 }}
      >
        Làm mới
      </Button>

      <Table
        rowKey={(record) => record.id || record.idSeri}
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
        size="small"
        locale={{ emptyText: "Chưa có serial number nào" }}
      />

      <Modal
        open={qrModalOpen}
        onCancel={() => setQrModalOpen(false)}
        footer={null}
        title={`QR Seri: ${currentSeri?.idSeri}`}
      >
        <div id="qr-print-area" style={{ textAlign: "center", padding: 16 }}>
          <QRCodeCanvas value={currentSeri?.idSeri || ""} size={200} includeMargin />
          <div style={{ marginTop: 8, fontWeight: 500 }}>{currentSeri?.idSeri}</div>
        </div>

        <Button
          type="primary"
          icon={<PrinterOutlined />}
          style={{ marginTop: 16 }}
          block
          onClick={handlePrintQr}
        >
          In QR
        </Button>
      </Modal>
    </div>
  );
};

export default ListSeriComponent;