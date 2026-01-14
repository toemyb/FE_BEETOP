import React, { useEffect, useMemo, useState } from "react";
import { Card, Steps, Space, Button, Modal, Tag, Spin, Tooltip } from "antd";
import { toast } from "react-toastify";
import { getOrderTimeline, updateOrderStatus } from "../../service/OrderTimelineService";
import 'react-toastify/dist/ReactToastify.css';
const { Step } = Steps;

// ===== BE chuẩn =====
// POS: 0 -> (6 hoặc 7)
// ONLINE/GIAO_HANG: 1..7 (cancel=7, done=6)

const stepStatus = (s) => {
  if (s === "DONE") return "finish";
  if (s === "CURRENT") return "process";
  if (s === "CANCELLED") return "error";
  return "wait";
};

// map text cho UI (optional)
const LABEL = {
  0: "Tạo đơn",
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang chuẩn bị hàng",
  4: "Đang giao hàng",
  5: "Đã giao hàng",
  6: "Hoàn thành",
  7: "Hủy đơn",
};

const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (raw.includes("giao_hang") || raw.includes("giao hàng") || raw.includes("delivery")) return "GIAO_HANG";
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos")) return "TAI_QUAY";
  return loaiDon || "";
};

const detectFlowFromData = (timeline) => {
  // ưu tiên loaiDon nếu có
  const type = normalizeLoaiDon(timeline?.loaiDon);
  if (type === "TAI_QUAY") return "TAI_QUAY";
  if (type === "ONLINE" || type === "GIAO_HANG") return "ONLINE_OR_DELIVERY";

  // fallback heuristic theo steps
  const codes = (timeline?.steps || [])
    .map((x) => Number(x?.code ?? x?.status ?? x?.newStatus))
    .filter((n) => !Number.isNaN(n));

  if (codes.includes(0)) return "TAI_QUAY";
  const uniq = Array.from(new Set(codes));
  const isPosSet = uniq.length > 0 && uniq.every((c) => c === 0 || c === 6 || c === 7);
  return isPosSet ? "TAI_QUAY" : "ONLINE_OR_DELIVERY";
};

// fallback steps nếu BE không trả steps/state
const buildFallbackSteps = (flow, current) => {
  const codes = flow === "TAI_QUAY" ? [0, 6, 7] : [1, 2, 3, 4, 5, 6, 7];
  return codes.map((code) => {
    let state = "UPCOMING";

    if (current === 7) {
      // canceled
      if (code === 7) state = "CANCELLED";
      else if (code < 7) state = "DONE";
      else state = "UPCOMING";
    } else {
      if (code < current) state = "DONE";
      else if (code === current) state = "CURRENT";
      else state = "UPCOMING";
    }

    // nếu completed
    if (current === 6) {
      if (code < 6) state = "DONE";
      if (code === 6) state = "CURRENT";
      if (code > 6) state = "UPCOMING";
    }

    return { code, title: LABEL[code] || `Bước ${code}`, state };
  });
};

export default function OrderTimelinePanel({ orderId, onChanged }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(false);

  const fetchTimeline = async () => {
    if (!orderId) return;
    try {
      setLoadingFetch(true);
      const timeline = await getOrderTimeline(orderId);
      setData(timeline); // service đã unwrap
    } catch (e) {
      console.error(e);
      toast.error("Không tải được timeline");
    } finally {
      setLoadingFetch(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // ===== derived =====
  const flow = useMemo(() => detectFlowFromData(data), [data]);
  const isPos = flow === "TAI_QUAY";

  const current = useMemo(() => Number(data?.trangThai ?? 0), [data?.trangThai]);
  const cancelCode = 7;
  const doneCode = 6;
  const isFinal = current === doneCode || current === cancelCode;

  // payment
  const paymentStatus = Number(data?.trangThaiThanhToan ?? data?.paymentStatus ?? 0); // 0/1
  const isPaid = paymentStatus === 1;

  const paymentText =
    data?.tenTrangThaiThanhToan ||
    (paymentStatus === 1 ? "Đã thanh toán" : "Chưa thanh toán");

  // COD detect (nếu BE có payments trong timeline)
  const isCodOrder = useMemo(() => {
    if (data?.isCod === true) return true;
    const pays = Array.isArray(data?.payments) ? data.payments : [];
    return pays.some((p) =>
      String(p?.tenHinhThuc || p?.methodName || p?.method || "")
        .toUpperCase()
        .includes("COD")
    );
  }, [data?.isCod, data?.payments]);

  const totalPaid = useMemo(() => {
  const pays = Array.isArray(data?.payments) ? data.payments : [];
  return pays.reduce((sum, p) => sum + Number(p?.soTien || p?.soTienThanhToan || 0), 0);
}, [data?.payments]);

  const doUpdate = async (newStatus, note = "") => {
    try {
      // ✅ POS: không cho updateStatus (BE bạn chặn)
      if (isPos) {
        toast.warn("Đơn tại quầy không chuyển bước.");
        return;
      }

      // ✅ không cho complete nếu chưa thanh toán (trừ COD ở DELIVERED)
      if (Number(newStatus) === doneCode && !isPaid) {
        const allowCodComplete = isCodOrder && Number(current) === 5;
        if (!allowCodComplete) {
          toast.warn("Chưa thanh toán đủ, không thể hoàn tất đơn.");
          return;
        }
      }

      setLoading(true); // ✅ đặt sau các return

      await updateOrderStatus(orderId, { newStatus: Number(newStatus), note });
      toast.success("Cập nhật trạng thái thành công");
      await fetchTimeline();
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Lỗi cập nhật trạng thái");
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
      centered: true,
      onOk: () => doUpdate(newStatus),
    });
  };

  // ✅ normalize steps: ưu tiên BE steps, nếu không có -> fallback
  const steps = useMemo(() => {
    const raw = Array.isArray(data?.steps) ? data.steps : [];
    const normalized = raw
      .map((s) => {
        const code = Number(s?.code ?? s?.status ?? s?.newStatus);
        if (Number.isNaN(code)) return null;
        return {
          code,
          title: s?.title || s?.name || LABEL[code] || `Bước ${code}`,
          state: s?.state, // có thể undefined
        };
      })
      .filter(Boolean);

    if (normalized.length > 0) {
      // nếu BE không set state -> suy từ current
      const hasState = normalized.some((x) => !!x.state);
      if (!hasState) {
        return buildFallbackSteps(flow, current).map((f) => {
          const found = normalized.find((n) => n.code === f.code);
          return found ? { ...found, state: f.state } : f;
        });
      }
      return normalized;
    }

    return buildFallbackSteps(flow, current);
  }, [data?.steps, flow, current]);

  // ✅ nextCode: tính theo current + flow, không phụ thuộc state (ổn định hơn)
  const nextCode = useMemo(() => {
    if (isPos) return null; // POS không chuyển bước

    const codes = steps.map((s) => Number(s.code)).filter((n) => !Number.isNaN(n));
    if (!codes.length) return null;

    // tìm code hợp lệ tiếp theo theo luồng 1->2->3->4->5->6, bỏ 7
    const forward = [1, 2, 3, 4, 5, 6].filter((c) => codes.includes(c));
    const idx = forward.indexOf(current);
    if (idx === -1) {
      // nếu current chưa nằm trong forward (vd current=0), bắt đầu từ phần tử đầu
      return forward[0] ?? null;
    }
    return forward[idx + 1] ?? null;
  }, [steps, current, isPos]);



  if (loadingFetch && !data) {
    return (
      <div style={{ padding: 12 }}>
        <Spin />
      </div>
    );
  }
  if (!data) return null;

  const canMove = !!nextCode && !isFinal && !isPos;
  const canCancel = useMemo(() => {
  if (isPos) return false;              // POS không dùng panel này
  if (isFinal) return false;            // completed/canceled

  // ✅ đã có thanh toán hoặc BE báo PAID -> không cho hủy
  if (isPaid || totalPaid > 0) return false;

  // ✅ ONLINE/GIAO_HANG: chỉ cho hủy khi còn PENDING_CONFIRM (1)
  if (current >= 2) return false; // từ CONFIRMED trở đi
if (current >= 4) return false;
  return true;
}, [isPos, isFinal, isPaid, totalPaid, current]); 


  return (
    <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 16 }}>
      <Card
        title="Timeline trạng thái đơn hàng"
        extra={<Tag color={isPaid ? "green" : "orange"}>{paymentText}</Tag>}
        style={{ borderRadius: 12 }}
      >
        <Steps direction="vertical">
          {steps.map((s) => (
            <Step
              key={String(s.code)}
              title={s.title}
              status={stepStatus(s.state)}
              description={s.state === "CURRENT" ? `Hiện tại: ${s.title}` : ""}
            />
          ))}
        </Steps>

        <Space style={{ marginTop: 16 }} wrap>
          {/* ✅ ONLINE/GIAO_HANG mới có chuyển bước */}
          <Tooltip title={isPos ? "Đơn tại quầy không chuyển bước bằng timeline" : ""}>
            <Button
              type="primary"
              loading={loading}
              disabled={!canMove}
              onClick={() => confirmUpdate(nextCode, "Chuyển bước tiếp theo")}
            >
              Chuyển bước
            </Button>
          </Tooltip>



          {/* ✅ Hủy */}
          <Button
            danger
            loading={loading}
            disabled={!canCancel}
            onClick={() => confirmUpdate(cancelCode, "Hủy đơn hàng")}
          >
            Hủy đơn
          </Button>
        </Space>
      </Card>

      <Card title="Lịch sử thay đổi" style={{ borderRadius: 12 }}>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {(data.logs || []).map((l, idx) => {
            const time = l?.time || l?.at || l?.createdAt || l?.created_time || l?.ngayTao;
            const by = l?.by || l?.actor || l?.createdBy || l?.nguoiThucHien || "Hệ thống";
            return (
              <Card key={idx} size="small">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <b>{l.title || "Cập nhật"}</b>
                    <div style={{ marginTop: 6 }}>{l.description || l.noiDung || "-"}</div>
                    <div style={{ marginTop: 6, opacity: 0.7 }}>Bởi: {by}</div>
                  </div>
                  <div style={{ whiteSpace: "nowrap", opacity: 0.7 }}>
                    {time ? new Date(time).toLocaleString("vi-VN") : "-"}
                  </div>
                </div>
              </Card>
            );
          })}
        </Space>
      </Card>
    </div>
  );
}
