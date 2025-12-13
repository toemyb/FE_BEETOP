import React, { useEffect, useState } from "react";
import { Card, Steps, Space, Button, Modal, message, Tag } from "antd";
import { getOrderTimeline, updateOrderStatus } from "../../service/OrderTimelineService";

const { Step } = Steps;

const stepStatus = (s) => {
  if (s === "DONE") return "finish";
  if (s === "CURRENT") return "process";
  if (s === "CANCELLED") return "error";
  return "wait";
};

export default function OrderTimelinePanel({ orderId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchTimeline = async () => {
    const res = await getOrderTimeline(orderId);
    setData(res.data);
  };

  useEffect(() => {
    if (!orderId) return;
    fetchTimeline();
  }, [orderId]);

  const doUpdate = async (newStatus, note = "") => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, { newStatus, note });
      message.success("Cập nhật trạng thái thành công");
      await fetchTimeline();
      onChanged?.(); // để component cha reload detail nếu muốn
    } catch (e) {
      message.error(e?.response?.data?.message || "Lỗi cập nhật trạng thái");
    } finally {
      setLoading(false);
    }
  };

  const confirmUpdate = (newStatus, title) => {
    Modal.confirm({
      title,
      content: "Bạn chắc chắn muốn thực hiện hành động này?",
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => doUpdate(newStatus),
    });
  };

  const nextMap = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };

  if (!data) return null;

  const current = data.trangThai;
  const next = nextMap[current];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
      <Card
        title="Timeline trạng thái đơn hàng"
        extra={
          <Tag color={data.trangThaiThanhToan === 1 ? "green" : "orange"}>
            {data.tenTrangThaiThanhToan}
          </Tag>
        }
        style={{ borderRadius: 12 }}
      >
        <Steps direction="vertical">
          {data.steps.map((s) => (
            <Step
              key={s.code}
              title={s.title}
              status={stepStatus(s.state)}
              description={s.state === "CURRENT" ? `Hiện tại: ${s.title}` : ""}
            />
          ))}
        </Steps>

        <Space style={{ marginTop: 16 }}>
          {next && (
            <Button type="primary" loading={loading} onClick={() => confirmUpdate(next, "Chuyển bước tiếp theo")}>
              Chuyển bước
            </Button>
          )}
          {current !== 6 && current !== 7 && (
            <Button danger loading={loading} onClick={() => confirmUpdate(7, "Hủy đơn hàng")}>
              Hủy đơn
            </Button>
          )}
        </Space>
      </Card>

      <Card title="Lịch sử thay đổi" style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {(data.logs || []).map((l, idx) => (
            <Card key={idx} size="small">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <b>{l.title}</b>
                  <div style={{ marginTop: 6 }}>{l.description}</div>
                  <div style={{ marginTop: 6, opacity: 0.7 }}>Bởi: {l.by}</div>
                </div>
                <div style={{ whiteSpace: "nowrap", opacity: 0.7 }}>
                  {new Date(l.time).toLocaleString("vi-VN")}
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
}
