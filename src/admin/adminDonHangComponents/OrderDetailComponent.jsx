// src/admin/adminDonHangComponents/OrderDetailComponent.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  Card,
  Descriptions,
  Tag,
  Table,
  Progress,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Timeline,
  Modal,
  Divider,
  Spin,
  Tooltip,
} from "antd";
import { toast } from "react-toastify";
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  PrinterOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  MinusCircleOutlined,
  CloseCircleFilled,
} from "@ant-design/icons";

import {
  getOrderDetail,
  unwrapApi,
  cancelOrder as cancelPosOrder,
} from "../../service/PosOrderService";

import {
  getOrderTimeline,
  updateOrderStatus,
} from "../../service/OrderTimelineService";

import InvoiceModal from "./InvoiceModal";
import { buildInvoiceHtml } from "./invoiceTemplate";

const { Title, Text } = Typography;

const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const time = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const date = d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  return `${time} ${date}`;
};

// ====== BE enums (backend bạn): OrderStatus 0..7 ======
// 0 DRAFT, 1 PENDING_CONFIRM, 2 CONFIRMED, 3 PREPARING, 4 SHIPPING, 5 DELIVERED, 6 COMPLETED, 7 CANCELED

const ORDER_STATUS_POS_MAP = {
  0: { text: "Tạo đơn", color: "gold" },
  6: { text: "Hoàn thành", color: "green" },
  7: { text: "Đã hủy", color: "red" },
};

const ORDER_STATUS_ONLINE_MAP = {
  0: { text: "Tạo đơn", color: "gold" },
  1: { text: "Chờ xác nhận", color: "gold" },
  2: { text: "Đã xác nhận", color: "cyan" },
  3: { text: "Đang chuẩn bị hàng", color: "blue" },
  4: { text: "Đang giao hàng", color: "geekblue" },
  5: { text: "Đã giao hàng", color: "purple" },
  6: { text: "Hoàn thành", color: "green" },
  7: { text: "Hủy đơn", color: "red" },
};

const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (
    raw.includes("giao_hang") ||
    raw.includes("giao hàng") ||
    raw.includes("delivery")
  )
    return "GIAO_HANG";
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos"))
    return "TAI_QUAY";
  return loaiDon || "";
};

const getLoaiDonText = (loaiDon) => {
  const t = normalizeLoaiDon(loaiDon);
  if (t === "ONLINE") return "Đơn hàng online";
  if (t === "GIAO_HANG") return "Bán giao hàng";
  if (t === "TAI_QUAY") return "Bán tại quầy";
  return loaiDon || "-";
};

const pickOrderStatus = (o) => {
  const st = o?.trangThaiDon ?? o?.trangThai ?? o?.status ?? 0;
  return Number(st);
};

const pickPaymentStatus = (o) => {
  const st = o?.trangThaiThanhToan ?? o?.paymentStatus ?? 0;
  return Number(st);
};

const getOrderStatusInfo = (order) => {
  const t = normalizeLoaiDon(order?.loaiDon);
  const st = pickOrderStatus(order);
  if (t === "ONLINE" || t === "GIAO_HANG") {
    return (
      ORDER_STATUS_ONLINE_MAP[st] || { text: "Không xác định", color: "default" }
    );
  }
  return ORDER_STATUS_POS_MAP[st] || { text: "Không xác định", color: "default" };
};

// ===== Timeline helpers =====
const STEP_DESC_BY_STATUS = {
  1: "Đơn hàng đang chờ xác nhận từ nhân viên. Vui lòng kiểm tra thông tin và xác nhận.",
  2: "Đơn hàng đã được xác nhận. Hệ thống sẽ chuyển sang chuẩn bị hàng.",
  3: "Đơn hàng đang được chuẩn bị (đóng gói, kiểm tra, chuẩn bị xuất kho).",
  4: "Đơn hàng đang được vận chuyển đến khách hàng.",
  5: "Đơn hàng đã được giao đến khách hàng.",
  6: "Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua hàng!",
  7: "Đơn hàng đã bị hủy.",
};

const LOG_TITLE_BY_CODE = {
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang chuẩn bị hàng",
  4: "Đang giao hàng",
  5: "Đã giao hàng",
  6: "Hoàn thành",
  7: "Hủy đơn",
};

const STEP_DESC_POS = {
  0: "Đơn hàng tại quầy đã được tạo.",
  6: "Đơn hàng tại quầy đã hoàn tất.",
  7: "Đơn hàng tại quầy đã bị hủy.",
};

const getStepVisual = (state) => {
  if (state === "DONE") return { color: "green", dot: <CheckCircleFilled /> };
  if (state === "CURRENT") return { color: "blue", dot: <ClockCircleOutlined /> };
  if (state === "CANCELLED") return { color: "red", dot: <CloseCircleFilled /> };
  return { color: "gray", dot: <MinusCircleOutlined /> };
};

const getProcessingTag = (status) => {
  if (status === 6) return <Tag color="green">Đã hoàn thành</Tag>;
  if (status === 7) return <Tag color="red">Đã hủy</Tag>;
  return <Tag color="blue">Đang xử lý</Tag>;
};

const pickLogTime = (log) =>
  log?.time || log?.at || log?.createdAt || log?.created_time || log?.ngayTao || null;

const pickLogBy = (log) =>
  log?.by ||
  log?.actor ||
  log?.createdBy ||
  log?.nguoiThucHien ||
  log?.tenNguoiThucHien ||
  "Hệ thống";

const OrderDetailComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);


  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [openInvoice, setOpenInvoice] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getOrderDetail(id);
      const data = unwrapApi(res);
      setOrder(data);
    } catch (err) {
      console.error("Lỗi load chi tiết đơn hàng:", err);
      toast.error("Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };
const paymentsForRender = useMemo(() => {
  const pays = Array.isArray(order?.payments) ? order.payments : [];

  const norm = (p) =>
    String(p?.tenHinhThuc || p?.methodName || p?.method || "")
      .trim()
      .toUpperCase();

  const map = new Map();

  for (const p of pays) {
    const key = norm(p) || "UNKNOWN";
    const soTien = Number(p?.soTien || p?.soTienThanhToan || 0);

    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...p, tenHinhThuc: p?.tenHinhThuc || key, soTien });
    } else {
      map.set(key, {
        ...prev,
        soTien: Number(prev.soTien || 0) + soTien,
        khachDua: p?.khachDua ?? prev.khachDua,
        tienTraLai: p?.tienTraLai ?? prev.tienTraLai,
      });
    }
  }

  // Ẩn dòng 0đ (tuỳ bạn có muốn giữ lại không)
  return Array.from(map.values()).filter((p) => Number(p.soTien || 0) !== 0);
}, [order?.payments]);



  const fetchTimeline = async () => {
    if (!id) return;
    try {
      setLoadingTimeline(true);
      const data = await getOrderTimeline(id);
      setTimeline(data);
    } catch (err) {
      console.error("Lỗi load timeline:", err);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchDetail(), fetchTimeline()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ===== derived =====
  const typeNorm = useMemo(() => normalizeLoaiDon(order?.loaiDon), [order?.loaiDon]);
  const isOnlineLike = typeNorm === "ONLINE" || typeNorm === "GIAO_HANG";
  const isPos = typeNorm === "TAI_QUAY";

  // COD detect từ payments (order detail)
  const isCodOrder = useMemo(() => {
    if (timeline?.isCod === true) return true;

    const pays =
      Array.isArray(timeline?.payments) ? timeline.payments :
        Array.isArray(order?.payments) ? order.payments : [];

    return pays.some((p) =>
      String(p?.tenHinhThuc || p?.methodName || p?.method || "")
        .toUpperCase()
        .includes("COD")
    );
  }, [timeline?.isCod, timeline?.payments, order?.payments]);

  const isCashMethod = (p) => {
    const name = String(p?.tenHinhThuc || p?.methodName || p?.method || "").toLowerCase();
    return name.includes("cash") || name.includes("tiền mặt") || name.includes("tien mat");
  };

  const hasCashPayment = useMemo(() => {
    const pays = Array.isArray(order?.payments) ? order.payments : [];
    return pays.some(isCashMethod);
  }, [order?.payments]);


  const mustPay = useMemo(() => Number(order?.tongTienThuHo || 0), [order?.tongTienThuHo]);

  const totalPaid = useMemo(() => {
    if (!Array.isArray(order?.payments)) return 0;
    return order.payments.reduce(
      (sum, p) => sum + Number(p.soTien || p.soTienThanhToan || 0),
      0
    );
  }, [order?.payments]);

  // PaymentStatus BE: 0 UNPAID, 1 PAID
  const psTimeline =
    timeline?.trangThaiThanhToan != null || timeline?.paymentStatus != null
      ? pickPaymentStatus(timeline)
      : null;

  const paidByBE = (psTimeline ?? pickPaymentStatus(order)) === 1;

  const isPaid = useMemo(
    () => paidByBE || (mustPay > 0 && totalPaid >= mustPay),
    [paidByBE, mustPay, totalPaid]
  );

  const paymentPercent = useMemo(() => {
    if (mustPay <= 0) return isPaid ? 100 : 0;
    return Math.min(100, Math.round((totalPaid * 100) / mustPay));
  }, [mustPay, totalPaid, isPaid]);

  const paymentStatusTag = useMemo(
    () => (isPaid ? <Tag color="green">Đã thanh toán</Tag> : <Tag color="orange">Chưa thanh toán</Tag>),
    [isPaid]
  );

  const orderStatusInfo = useMemo(() => getOrderStatusInfo(order), [order]);
  const tongSanPham = useMemo(() => order?.items?.length || 0, [order?.items]);

  const currentStatus = useMemo(() => {
    const st = timeline?.trangThai ?? pickOrderStatus(order) ?? 0;
    return Number(st);
  }, [timeline?.trangThai, order]);

  const doneCode = 6;
  const cancelCode = 7;

  const isFinal = useMemo(() => currentStatus === doneCode || currentStatus === cancelCode, [currentStatus]);
  const canCancel = useMemo(() => {
  if (isFinal) return false;

  // ✅ POS: đã có payment -> không hủy
  if (isPos) return totalPaid <= 0;

  // ✅ ONLINE/GIAO_HANG: theo rule giống customer (BE mới)
  if (isOnlineLike) {
    if (isPaid || totalPaid > 0) return false;
    if (currentStatus >= 4) return false; // từ CONFIRMED trở đi
  }

  return true;
}, [isFinal, isPos, isOnlineLike, isPaid, totalPaid, currentStatus]);

  const canCancelPos = canCancel;

  const shippingFee = useMemo(() => {
    return (
      Number(
        order?.phiVanChuyen ??
        order?.phiShip ??
        order?.shippingFee ??
        order?.tienShip ??
        0
      ) || 0
    );
  }, [order]);

  const invoiceHtml = useMemo(() => {
    if (!order) return "<!doctype html><html><head><meta charset='utf-8'/></head><body></body></html>";
    return buildInvoiceHtml({ order, shippingFee });
  }, [order, shippingFee]);

  const extractAddressFromNote = (note) => {
  if (!note) return null;
  const txt = String(note).trim();
  if (!txt) return null;

  // Ưu tiên 1 dòng có prefix rõ ràng
  const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const line =
    lines.find((l) => /^địa\s*chỉ\s*:/i.test(l)) ||
    lines.find((l) => /^đc\s*:/i.test(l)) ||
    lines.find((l) => /^\[ship_address\]/i.test(l));

  if (line) {
    return line
      .replace(/^(địa\s*chỉ|đc)\s*:\s*/i, "")
      .replace(/^\[ship_address\]\s*/i, "")
      .trim();
  }

  // Nếu bạn lưu ghi chú chỉ có đúng địa chỉ -> lấy luôn
  return txt;
};

const fullAddress = useMemo(() => {
  const detail = order?.diaChiChiTiet || order?.diaChi;
  const parts = [detail, order?.phuongXa, order?.quanHuyen, order?.tinhThanh].filter(Boolean);

  const seen = new Set();
  const uniq = [];
  for (const p of parts) {
    const key = String(p).trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      uniq.push(key);
    }
  }

  // ✅ Nếu có field địa chỉ riêng -> dùng như cũ
  if (uniq.length) return uniq.join(", ");

  // ✅ Nếu không có (khách lẻ) -> lấy từ ghi chú
  return extractAddressFromNote(order?.ghiChu) || "-";
}, [
  order?.diaChiChiTiet,
  order?.diaChi,
  order?.phuongXa,
  order?.quanHuyen,
  order?.tinhThanh,
  order?.ghiChu,
]);

  const handlePrintInvoice = () => {
    try {
      const w = window.open("", "_blank", "width=920,height=720");
      if (!w) {
        toast.error("Trình duyệt đang chặn popup. Hãy cho phép popup để in hóa đơn.");
        return;
      }
      w.document.open();
      w.document.write(invoiceHtml);
      w.document.close();
      w.onload = () => {
        w.focus();
        w.print();
      };
    } catch (e) {
      console.error(e);
      toast.error("Không thể in hóa đơn");
    }
  };

  // ===== build steps fallback =====
  const buildFallbackSteps = (typeNormArg, current, cancelC, doneC) => {
    const isPosFlow = typeNormArg === "TAI_QUAY";
    const map = isPosFlow ? ORDER_STATUS_POS_MAP : ORDER_STATUS_ONLINE_MAP;
    const codes = isPosFlow ? [0, 6, 7] : [1, 2, 3, 4, 5, 6, 7];

    return codes.map((code) => {
      const title = map[code]?.text || `Bước ${code}`;

      let state = "UPCOMING";
      if (current === cancelC) {
        if (code === cancelC) state = "CANCELLED";
        else if (code < cancelC) state = "DONE";
        else state = "UPCOMING";
      } else {
        if (code < current) state = "DONE";
        else if (code === current) state = "CURRENT";
        else state = "UPCOMING";
      }

      if (current === doneC) {
        if (code < doneC) state = "DONE";
        if (code === doneC) state = "CURRENT";
        if (code > doneC) state = "UPCOMING";
      }

      return { code, title, state };
    });
  };

  const stepsRaw = useMemo(
    () => (Array.isArray(timeline?.steps) ? timeline.steps : []),
    [timeline?.steps]
  );

  const logsRaw = useMemo(
    () => (Array.isArray(timeline?.logs) ? timeline.logs : []),
    [timeline?.logs]
  );




  // ✅ FIX: nếu BE trả steps nhưng thiếu state -> tự suy ra state theo currentStatus
  const stepsForRender = useMemo(() => {
    if (stepsRaw.length > 0) {
      const fallback = buildFallbackSteps(typeNorm, currentStatus, cancelCode, doneCode);
      const fallbackStateByCode = new Map(fallback.map((x) => [Number(x.code), x.state]));

      return stepsRaw
        .map((s) => {
          const code = Number(s.code ?? s.status ?? s.newStatus);
          const safeCode = Number.isNaN(code) ? 0 : code;

          const titleFromMap =
            (isPos ? ORDER_STATUS_POS_MAP[safeCode]?.text : ORDER_STATUS_ONLINE_MAP[safeCode]?.text) ||
            `Bước ${safeCode}`;

          const stateFromBe = s.state;
          const stateFromFallback = fallbackStateByCode.get(safeCode) || "UPCOMING";

          return {
            code: safeCode,
            title: s.title || s.name || titleFromMap,
            state: stateFromBe || stateFromFallback,
          };
        })
        .filter(Boolean);
    }

    return buildFallbackSteps(typeNorm, currentStatus, cancelCode, doneCode);
  }, [stepsRaw, typeNorm, currentStatus, cancelCode, doneCode, isPos]);

  // ✅ POS không có next
  const nextStatus = useMemo(() => {
    if (isPos) return null;
    if (isFinal) return null;

    const codes = stepsForRender
      .map((s) => Number(s.code))
      .filter((n) => !Number.isNaN(n) && n !== cancelCode); // bỏ 7

    if (!codes.length) return null;

    // thứ tự chuẩn BE (hỗ trợ case DELIVERY tạo từ POS: có 0 rồi nhảy 3)
    const ORDER = [0, 1, 2, 3, 4, 5, 6];
    const forward = ORDER.filter((c) => codes.includes(c));

    // nếu current chưa nằm trong forward (vd current=0 nhưng forward=[1..6] hoặc data lỗi)
    if (!forward.includes(currentStatus)) {
      const firstGreater = forward.find((c) => c > currentStatus);
      return firstGreater != null ? { code: firstGreater, label: "Chuyển bước tiếp theo" } : null;
    }

    const idx = forward.indexOf(currentStatus);
    const nextCode = forward[idx + 1];
    return nextCode != null ? { code: nextCode, label: "Chuyển bước tiếp theo" } : null;
  }, [stepsForRender, isPos, isFinal, currentStatus, cancelCode]);

  // ===== Actions =====
  const handleUpdateStatus = async (newStatus, note) => {
    if (!id) return;

    if (isPos) {
      toast.warn("Đơn tại quầy không cập nhật trạng thái");
      return;
    }

    // ✅ CHẶN: hoàn tất khi chưa thanh toán
    if (Number(newStatus) === doneCode && !isPaid) {
  const allowCodComplete = isCodOrder && Number(currentStatus) === 5; // DELIVERED -> COMPLETED
  if (!allowCodComplete) {
    toast.warn("Chưa thanh toán đủ, không thể hoàn tất đơn.");
    return;
  }
}

    try {
      await updateOrderStatus(id, { newStatus, note: note || "" });
      toast.success("Cập nhật trạng thái thành công");
      await refreshAll();
      window.dispatchEvent(
  new CustomEvent("orders:changed", {
    detail: { orderId: id, newStatus: Number(newStatus) },
  })
);
    } catch (err) {
      const beMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Cập nhật thất bại";
      toast.error(beMsg);
      console.error(err);
    }
  };

  

  const handleCancelPos = async () => {
    if (!id) return;
    try {
      await cancelPosOrder(id);
      toast.success("Đã hủy đơn tại quầy");
      await refreshAll();
    } catch (err) {
      const beMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Hủy đơn thất bại";
      toast.error(beMsg);
      console.error(err);
    }
  };

  const confirmNext = () => {
    if (!nextStatus) return;
    const statusMap = isPos ? ORDER_STATUS_POS_MAP : { ...ORDER_STATUS_ONLINE_MAP, 0: { text: "Tạo đơn" } };

    Modal.confirm({
      title: "Xác nhận cập nhật trạng thái?",
      content: (
        <div>
          Bạn muốn chuyển trạng thái sang:{" "}
          <b>{statusMap[nextStatus.code]?.text || nextStatus.code}</b>
          <div style={{ marginTop: 6, color: "#64748b" }}>
            Hành động này sẽ được ghi log lịch sử đơn hàng.
          </div>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      centered: true,
      onOk: () => handleUpdateStatus(nextStatus.code),
    });
  };

  const confirmCancel = () => {

      if (!canCancel) {
    toast.warn("Đơn này hiện không đủ điều kiện hủy.");
    return;
  }
    Modal.confirm({
      title: "Xác nhận hủy đơn hàng?",
      content: isPos
        ? "Sau khi hủy, đơn tại quầy sẽ không thể hoàn tất."
        : "Sau khi hủy, đơn sẽ không thể tiếp tục luồng xử lý.",
      okText: "Hủy đơn",
      okButtonProps: { danger: true },
      cancelText: "Không",
      centered: true,
      onOk: () => {
        if (isPos) return handleCancelPos();
        return handleUpdateStatus(cancelCode, "Hủy bởi nhân viên");
      },
    });
  };

  // ===== Columns =====
  const productColumns = [
    { title: "Sản phẩm", dataIndex: "tenSanPham", key: "tenSanPham" },
    { title: "Cấu hình", dataIndex: "cauHinh", key: "cauHinh", width: "40%" },
    {
      title: "Giá bán",
      dataIndex: "giaBan",
      key: "giaBan",
      align: "right",
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    { title: "Serial", dataIndex: "maSeri", key: "maSeri" },
  ];

  const paymentColumns = useMemo(() => {
    const cols = [
      { title: "Phương thức", dataIndex: "tenHinhThuc", key: "tenHinhThuc" },
      {
        title: "Số tiền thanh toán",
        dataIndex: "soTien",
        key: "soTien",
        align: "right",
        render: (v) => <Text strong>{formatCurrency(v)}</Text>,
      },
    ];

    // ✅ Chỉ khi có CASH mới hiện 2 cột này
    if (hasCashPayment) {
      cols.splice(1, 0,
        {
          title: "Khách đưa",
          dataIndex: "khachDua",
          key: "khachDua",
          align: "right",
          render: (v, row) => (isCashMethod(row) ? formatCurrency(v) : "-"),
        },
      );

      cols.push({
        title: "Tiền trả lại",
        dataIndex: "tienTraLai",
        key: "tienTraLai",
        align: "right",
        render: (v, row) => (isCashMethod(row) ? formatCurrency(v) : "-"),
      });
    }

    return cols;
  }, [hasCashPayment]);

  // ===== Render timeline =====
  const renderTimeline = () => {
    if (!isOnlineLike && !isPos) {
      return (
        <Card size="small" style={{ borderRadius: 12, borderColor: "#edf2ff" }}>
          <Text type="secondary">
            Timeline hiện chỉ áp dụng cho <b>đơn ONLINE / GIAO_HÀNG / TẠI QUẦY</b>.
          </Text>
        </Card>
      );
    }

    const steps = stepsForRender;
    const logs = logsRaw;

    if (loadingTimeline && !timeline) {
      return (
        <div style={{ padding: 16 }}>
          <Spin />
        </div>
      );
    }

    const findLogForStep = (step) => {
      if (!Array.isArray(logs) || logs.length === 0) return null;

      const codeNum = Number(step?.code);
      const expectedTitleA = (step?.title || "").trim();
      const expectedTitleB = (LOG_TITLE_BY_CODE[codeNum] || "").trim();

      for (let i = logs.length - 1; i >= 0; i--) {
        const l = logs[i] || {};
        const t = (l?.title || "").trim();
        const codeFromLog = Number(
          l?.code ?? l?.status ?? l?.newStatus ?? l?.trangThai ?? l?.hanhDong
        );

        if (expectedTitleA && t === expectedTitleA) return l;
        if (expectedTitleB && t === expectedTitleB) return l;
        if (!Number.isNaN(codeFromLog) && codeFromLog === codeNum) return l;
      }
      return null;
    };

    const nonCancelSteps = steps.filter((s) => Number(s.code) !== cancelCode);
    const timelineTotalSteps = nonCancelSteps.length || 1;
    const doneCount = nonCancelSteps.filter((s) => (s.state || "") === "DONE").length;
    const hasCurrent = nonCancelSteps.some((s) => (s.state || "") === "CURRENT") ? 1 : 0;
    const completedSteps = Math.min(timelineTotalSteps, doneCount + hasCurrent);
    const timelinePercent = Math.round((completedSteps * 100) / timelineTotalSteps);

    const statusColorMap = isPos ? ORDER_STATUS_POS_MAP : ORDER_STATUS_ONLINE_MAP;



    return (
      <div>
        <Card size="small" style={{ borderRadius: 12, borderColor: "#edf2ff" }} styles={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <Text strong>Timeline trạng thái đơn hàng</Text>
              <div style={{ marginTop: 6 }}>
                <Text type="secondary">Tiến trình đơn hàng</Text>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary">
                {completedSteps}/{timelineTotalSteps} bước hoàn thành
              </Text>
              <div style={{ marginTop: 6 }}>{getProcessingTag(currentStatus)}</div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <Progress percent={timelinePercent} />
          </div>

          <Divider style={{ margin: "12px 0" }} />

          <Timeline mode="left" style={{ marginTop: 6 }}>
            {steps.map((s) => {
              const codeNum = Number(s.code);
          
              const visual = getStepVisual(s.state);

              const isCurrent = s.state === "CURRENT";
              const isDone = s.state === "DONE";
              const isUpcoming = s.state === "UPCOMING";
              const isCancelled = s.state === "CANCELLED";

              const titlePrefix = isCurrent
                ? "Hiện tại:"
                : isDone
                  ? "Đã xong:"
                  : isUpcoming
                    ? "Sắp tới:"
                    : "Trạng thái:";

              const matchedLog = findLogForStep(s);
              const timeLabel = pickLogTime(matchedLog)
                ? formatDateTime(pickLogTime(matchedLog))
                : "-";

              return (
                <Timeline.Item key={String(s.code)} color={visual.color} dot={visual.dot} label={timeLabel}>
                  <Card
                    size="small"
                    style={{
                      borderRadius: 12,
                      borderColor: isCurrent ? "#93c5fd" : isCancelled ? "#fecaca" : "#e5e7eb",
                      boxShadow: isCurrent ? "0 10px 22px rgba(59,130,246,0.12)" : "0 6px 14px rgba(15,23,42,0.03)",
                      opacity: isUpcoming ? 0.55 : 1,
                    }}
                  >
                    <Space direction="vertical" size={6} style={{ width: "100%" }}>
                      <Space size={8} wrap>
                        <Tag color={statusColorMap[codeNum]?.color || "default"}>{s.title}</Tag>
                        <Text strong>
                          {titlePrefix} {s.title}
                        </Text>

                        {isCurrent && codeNum === doneCode && <Tag color="green">Hoàn tất</Tag>}
                        {isCurrent && codeNum === cancelCode && <Tag color="red">Đã hủy</Tag>}
                        {isCurrent && codeNum !== doneCode && codeNum !== cancelCode && <Tag color="blue">Đang xử lý</Tag>}

                        {isDone && <Tag color="green">Hoàn tất</Tag>}
                        {isCancelled && <Tag color="red">Đã hủy</Tag>}
                    
                      </Space>


                      <Text type="secondary">
                        {(isPos ? STEP_DESC_POS[codeNum] : STEP_DESC_BY_STATUS[codeNum]) || "Cập nhật trạng thái đơn hàng."}
                      </Text>

                      <Text type="secondary">
                        Bởi: <b>{matchedLog ? pickLogBy(matchedLog) : "Hệ thống"}</b>
                      </Text>
                    </Space>
                  </Card>
                </Timeline.Item>
              );
            })}
          </Timeline>

          <Divider style={{ margin: "12px 0" }} />

          {/* ✅ Actions */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {/* ✅ ONLINE/GIAO_HANG mới có chuyển bước */}
            {!isPos && (
              <Button type="primary" disabled={!nextStatus || isFinal} onClick={confirmNext}>
                {nextStatus?.label || "Chuyển bước"}
              </Button>
            )}

    

            {/* ✅ POS: disable nếu đã có payment */}
            {isPos ? (
              <Tooltip
                title={
                  !canCancel
                    ? "Đơn đã kết thúc"
                    : totalPaid > 0
                      ? "Đơn tại quầy đã có thanh toán, không thể hủy"
                      : ""
                }
              >
                <Button danger disabled={!canCancelPos} onClick={confirmCancel}>
                  Hủy đơn hàng
                </Button>
              </Tooltip>
            ) : (
              <Button danger disabled={!canCancel} onClick={confirmCancel}>
                Hủy đơn hàng
              </Button>
            )}
          </div>
        </Card>

        <Card size="small" title="Lịch sử thay đổi" style={{ marginTop: 16, borderRadius: 12, borderColor: "#edf2ff" }}>
          {Array.isArray(logs) && logs.length > 0 ? (
            <Timeline>
              {logs.map((l, idx) => (
                <Timeline.Item key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <Text strong>{l.title || "Cập nhật"}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{l.description || l.noiDung || l.moTa || "-"}</Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">
                          Bởi: <b>{pickLogBy(l)}</b>
                        </Text>
                      </div>
                    </div>
                    <Text type="secondary">{formatDateTime(pickLogTime(l))}</Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <Text type="secondary">Chưa có lịch sử thay đổi.</Text>
          )}
        </Card>
      </div>
    );
  };

  // ===== safe early return =====
  if (!order && !loading) {
    return (
      <div style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <Button
            type="link"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            style={{ paddingLeft: 0, marginBottom: 12 }}
          >
            Quay lại
          </Button>
          <Card>Không tìm thấy đơn hàng. Vui lòng kiểm tra lại đường dẫn.</Card>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, minHeight: "100vh", background: "#f5f7fb", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Space align="start">
            <Button icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Chi tiết đơn hàng {order?.maDonHang}
              </Title>
              <div style={{ marginTop: 4 }}>
                <Text type="secondary">Xem thông tin chi tiết và lịch sử thay đổi của đơn hàng</Text>
              </div>
              <div style={{ marginTop: 8 }}>
                <Space size={6} wrap>
                  <Tag color="cyan">{getLoaiDonText(order?.loaiDon)}</Tag>
                  <Tag color={orderStatusInfo.color}>{orderStatusInfo.text}</Tag>
                  {paymentStatusTag}
                </Space>
              </div>
            </div>
          </Space>

          <Space>
            <Button icon={<FileTextOutlined />} onClick={() => setOpenInvoice(true)} disabled={!order}>
              Xem hóa đơn
            </Button>
            <Button icon={<PrinterOutlined />} onClick={handlePrintInvoice} disabled={!order}>
              In hóa đơn
            </Button>
            <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading || loadingTimeline}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* MAIN CARD + TABS */}
        <Card
          style={{ borderRadius: 16, boxShadow: "0 8px 20px rgba(15,23,42,0.04)", border: "1px solid #edf2ff" }}
          styles={{ paddingTop: 12 }}
        >
          <Tabs defaultActiveKey="info" tabBarStyle={{ marginBottom: 16 }}>
            <Tabs.TabPane tab="Thông tin đơn hàng" key="info">
              <Row gutter={[16, 16]} align="stretch">
                <Col xs={24} md={12} lg={12} style={{ display: "flex" }}>
                  <Card size="small" title="Thông tin cơ bản" style={{ borderRadius: 12, borderColor: "#edf2ff", flex: 1 }}>
                    <Descriptions column={1} size="small" colon={false} labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item label="Mã đơn hàng">{order?.maDonHang}</Descriptions.Item>
                      <Descriptions.Item label="Loại đơn hàng">
                        <Tag color="cyan">{getLoaiDonText(order?.loaiDon)}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái đơn hàng">
                        <Tag color={orderStatusInfo.color}>{orderStatusInfo.text}</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">{formatDateTime(order?.ngayTao)}</Descriptions.Item>
                      <Descriptions.Item label="Ngày cập nhật">{formatDateTime(order?.ngayCapNhat)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={12} style={{ display: "flex" }}>
                  <Card size="small" title="Thông tin khách hàng" style={{ borderRadius: 12, borderColor: "#edf2ff", flex: 1 }}>
                    <Descriptions column={1} size="small" colon={false} labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item label="Tên khách hàng">{order?.tenKhachHang || "Khách vãng lai"}</Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">{order?.sdtKhachHang || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Email">{order?.emailKhachHang || "-"}</Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 12, padding: 10, background: "#f5f5f5", borderRadius: 8 }}>
                      <Text strong style={{ display: "block", marginBottom: 4 }}>
                        Thông tin giao hàng
                      </Text>
                      <div>
                        <Text strong>Người nhận: </Text>
                        <Text>{order?.tenNguoiNhan || order?.tenKhachHang || "-"}</Text>
                      </div>
                      <div>
                        <Text strong>Số điện thoại: </Text>
                        <Text>{order?.sdtNguoiNhan || order?.sdtKhachHang || "-"}</Text>
                      </div>
                      <div style={{ marginTop: 6 }}>
                        <Text strong>Địa chỉ: </Text>
                        <Text>{fullAddress}</Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={12} style={{ display: "flex" }}>
                  <Card size="small" title="Thông tin nhân viên" style={{ borderRadius: 12, borderColor: "#edf2ff", flex: 1 }}>
                    <Descriptions column={1} size="small" colon={false} labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item label="Nhân viên tạo đơn">{order?.tenNhanVien || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Mã nhân viên">{order?.maNhanVien || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">{order?.sdtNhanVien || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Email">{order?.emailNhanVien || "-"}</Descriptions.Item>
                      <Descriptions.Item label="Ngày tạo">{formatDateTime(order?.ngayTao)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} md={12} lg={12} style={{ display: "flex" }}>
                  <Card size="small" title="Tổng kết đơn hàng" style={{ borderRadius: 12, borderColor: "#edf2ff", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Tổng sản phẩm:</span>
                      <span>
                        <strong>{tongSanPham}</strong> sản phẩm
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Tổng tiền hàng:</span>
                      <span>{formatCurrency(order?.giaTriChuaGiam)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span>Giảm giá voucher:</span>
                      <span style={{ color: "#f11e1e" }}>- {formatCurrency(order?.giaTriGiamGia)}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>Phí vận chuyển:</span>
                      <span>{formatCurrency(shippingFee)}</span>
                    </div>

                    <div style={{ borderTop: "1px solid #f0f0f0", margin: "8px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                      <span>Tổng thanh toán:</span>
                      <span style={{ color: "#12b886" }}>{formatCurrency(order?.tongTienThuHo)}</span>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Sản phẩm" key="products">
              <Card
                size="small"
                title="Danh sách sản phẩm"
                style={{ borderRadius: 12, borderColor: "#edf2ff" }}
                extra={
                  <span>
                    Tổng số lượng: <Text strong>{tongSanPham}</Text>
                  </span>
                }
              >
                <Table rowKey="orderCtId" columns={productColumns} dataSource={order?.items || []} pagination={false} />
                <div style={{ marginTop: 16, textAlign: "right", fontWeight: 600 }}>
                  Tổng tiền hàng: <span style={{ color: "#e67e22" }}>{formatCurrency(order?.giaTriChuaGiam)}</span>
                </div>
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Thanh toán" key="payment">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Card
                    size="small"
                    title="Trạng thái thanh toán"
                    extra={paymentStatusTag}
                    style={{ borderRadius: 12, borderColor: "#edf2ff" }}
                  >
                    <p style={{ marginBottom: 8 }}>
                      {isPaid ? "Đơn hàng đã được thanh toán đầy đủ" : "Đơn hàng chưa thanh toán đủ"}
                    </p>
                    <Progress percent={paymentPercent} status={isPaid ? "success" : "active"} />
                    <Descriptions size="small" column={1} colon={false} style={{ marginTop: 12 }} labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item label="Tổng thanh toán">{formatCurrency(mustPay)}</Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">{formatCurrency(totalPaid)}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>

                <Col xs={24} md={12}>
                  <Card size="small" title="Tổng kết thanh toán" style={{ borderRadius: 12, borderColor: "#edf2ff" }}>
                    <Descriptions size="small" column={1} colon={false} labelStyle={{ fontWeight: 500 }}>
                      <Descriptions.Item label="Tổng tiền hàng">{formatCurrency(order?.giaTriChuaGiam)}</Descriptions.Item>
                      <Descriptions.Item label="Giảm giá voucher">- {formatCurrency(order?.giaTriGiamGia)}</Descriptions.Item>
                      <Descriptions.Item label="Phí vận chuyển">{formatCurrency(shippingFee)}</Descriptions.Item>
                      <Descriptions.Item label="Tổng thanh toán">
                        <Text strong type="success">
                          {formatCurrency(mustPay)}
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Đã thanh toán">
                        <Text strong>{formatCurrency(totalPaid)}</Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Trạng thái">{paymentStatusTag}</Descriptions.Item>
                    </Descriptions>
                  </Card>
                </Col>
              </Row>

              <Card size="small" title="Phương thức thanh toán" style={{ marginTop: 16, borderRadius: 12, borderColor: "#edf2ff" }}>
                <Table
                  rowKey={(row, idx) => row?.id || row?.paymentId || row?.ma || `${row?.tenHinhThuc || "pay"}-${idx}`}
                  columns={paymentColumns}
                  dataSource={paymentsForRender}
                  pagination={false}
                />
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Trạng thái" key="status">
              {renderTimeline()}
            </Tabs.TabPane>
          </Tabs>
        </Card>

        <InvoiceModal open={openInvoice} onClose={() => setOpenInvoice(false)} html={invoiceHtml} onPrint={handlePrintInvoice} />
      </div>
    </div>
  );
};

export default OrderDetailComponent;
