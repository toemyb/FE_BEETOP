import React, { useEffect, useMemo, useState } from "react";
import { Card, Steps, Space, Button, Modal, message, Tag } from "antd";
import { getOrderTimeline, updateOrderStatus } from "../../service/OrderTimelineService";

const { Step } = Steps;

const stepStatus = (s) => {
  if (s === "DONE") return "finish";
  if (s === "CURRENT") return "process";
  if (s === "CANCELLED") return "error";
  return "wait";
};

// Heuristic nhận diện luồng theo steps.code (POS thường max <= 3)
const detectFlow = (timeline) => {
  const codes = (timeline?.steps || [])
    .map((x) => Number(x?.code))
    .filter((n) => !Number.isNaN(n));
  const maxCode = codes.length ? Math.max(...codes) : 0;
  return maxCode <= 3 ? "TAI_QUAY" : "ONLINE_OR_DELIVERY";
};

export default function OrderTimelinePanel({ orderId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const flow = useMemo(() => detectFlow(data), [data]);

  const fetchTimeline = async () => {
    const timeline = await getOrderTimeline(orderId);
    setData(timeline); // ✅ FIX: unwrap rồi, không có .data
  };

  useEffect(() => {
    if (!orderId) return;
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const doUpdate = async (newStatus, note = "") => {
    try {
      setLoading(true);
      await updateOrderStatus(orderId, { newStatus, note });
      message.success("Cập nhật trạng thái thành công");
      await fetchTimeline();
      onChanged?.();
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

  // ✅ Tính “bước tiếp theo” dựa trên steps trả về từ BE (không hardcode 1->2->3...)
  const nextCode = useMemo(() => {
    const steps = data?.steps || [];
    const idx = steps.findIndex((s) => s.state === "CURRENT");
    if (idx === -1) return null;
    // tìm step UPCOMING đầu tiên sau CURRENT
    for (let i = idx + 1; i < steps.length; i++) {
      if (steps[i]?.state === "UPCOMING") return steps[i]?.code;
    }
    return null;
  }, [data]);

  const current = Number(data?.trangThai ?? 0);

  // ✅ Quy ước cancel code theo luồng
  const cancelCode = flow === "TAI_QUAY" ? 3 : 7;

  const isFinal =
    flow === "TAI_QUAY"
      ? current === 2 || current === 3
      : current === 6 || current === 7;

  if (!data) return null;

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
          {(data.steps || []).map((s) => (
            <Step
              key={s.code}
              title={s.title} // ✅ DTO: title
              status={stepStatus(s.state)}
              description={s.state === "CURRENT" ? `Hiện tại: ${s.title}` : ""}
            />
          ))}
        </Steps>

        <Space style={{ marginTop: 16 }}>
          {!!nextCode && !isFinal && (
            <Button
              type="primary"
              loading={loading}
              onClick={() => confirmUpdate(nextCode, "Chuyển bước tiếp theo")}
            >
              Chuyển bước
            </Button>
          )}

          {!isFinal && (
            <Button
              danger
              loading={loading}
              onClick={() => confirmUpdate(cancelCode, "Hủy đơn hàng")}
            >
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
                  {/* ✅ DTO: time */}
                  {l.time ? new Date(l.time).toLocaleString("vi-VN") : "-"}
                </div>
              </div>
            </Card>
          ))}
        </Space>
      </Card>
    </div>
  );
}
