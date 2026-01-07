// src/admin/adminDonHangComponents/InvoiceModal.jsx
import React from "react";
import { Modal, Button } from "antd";
import { PrinterOutlined } from "@ant-design/icons";

const InvoiceModal = ({ open, onClose, html, onPrint }) => {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Hóa đơn"
      width={980}
      centered
      destroyOnClose
      footer={[
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
        <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={onPrint} disabled={!html}>
          In hóa đơn
        </Button>,
      ]}
    >
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
        <iframe
          title="invoice-preview"
          style={{ width: "100%", height: "78vh", border: "none", background: "#fff" }}
          srcDoc={html || "<div style='padding:16px;'>Không có dữ liệu hóa đơn</div>"}
        />
      </div>
    </Modal>
  );
};

export default InvoiceModal;
