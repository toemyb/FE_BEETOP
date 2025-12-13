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
  message,
  Divider,
  Spin,
} from "antd";
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

import { getOrderDetail, unwrapApi } from "../../service/PosOrderService";
import { getOrderTimeline, updateOrderStatus } from "../../service/OrderTimelineService";

const { Title, Text } = Typography;

const formatCurrency = (amount) => {
  const n = Number(amount || 0);
  return n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const time = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false });
  const date = d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${time} ${date}`;
};

// POS (tại quầy) - ví dụ của bạn
const ORDER_STATUS_MAP = {
  1: { text: "Đang chuẩn bị hàng", color: "blue" },
  2: { text: "Hoàn thành", color: "green" },
  3: { text: "Đã hủy", color: "red" },
};

// ONLINE (khớp 1..7)
const ORDER_STATUS_ONLINE_MAP = {
  1: { text: "Chờ xác nhận", color: "gold" },
  2: { text: "Đã xác nhận", color: "cyan" },
  3: { text: "Đang chuẩn bị hàng", color: "blue" },
  4: { text: "Chuẩn bị giao hàng", color: "geekblue" },
  5: { text: "Đang giao hàng", color: "purple" },
  6: { text: "Hoàn thành", color: "green" },
  7: { text: "Hủy đơn", color: "red" },
};

const ORDER_TYPE_MAP = {
  TAI_QUAY: "Bán tại quầy",
  ONLINE: "Đơn hàng online",
};

// === normalize loaiDon từ DB (VD: "Đơn hàng Online") ===
const normalizeLoaiDon = (loaiDon) => {
  const raw = (loaiDon || "").toString().toLowerCase();
  if (raw.includes("online")) return "ONLINE";
  if (raw.includes("quầy") || raw.includes("tai_quay") || raw.includes("pos")) return "TAI_QUAY";
  return loaiDon || "";
};

const getLoaiDonText = (loaiDon) => {
  const t = normalizeLoaiDon(loaiDon);
  if (t === "ONLINE") return "Đơn hàng online";
  if (t === "TAI_QUAY") return "Bán tại quầy";
  return loaiDon || "-";
};

const getOrderStatusInfo = (order) => {
  const t = normalizeLoaiDon(order?.loaiDon);
  if (t === "ONLINE") {
    return ORDER_STATUS_ONLINE_MAP[order?.trangThai] || { text: "Không xác định", color: "default" };
  }
  return ORDER_STATUS_MAP[order?.trangThai] || { text: "Không xác định", color: "default" };
};

// ===== Timeline helpers =====
const STEP_DESC_BY_STATUS = {
  1: "Đơn hàng đang chờ xác nhận từ nhân viên. Vui lòng kiểm tra thông tin và xác nhận.",
  2: "Đơn hàng đã được xác nhận. Hệ thống sẽ chuyển sang chuẩn bị hàng.",
  3: "Đơn hàng đang được chuẩn bị (đóng gói, kiểm tra, chuẩn bị xuất kho).",
  4: "Đơn hàng đã sẵn sàng bàn giao cho đơn vị vận chuyển.",
  5: "Đơn hàng đang được vận chuyển đến khách hàng.",
  6: "Đơn hàng đã hoàn thành. Cảm ơn bạn đã mua hàng!",
  7: "Đơn hàng đã bị hủy.",
};

// ✅ title log theo BE (đã đổi: status 1 = "Chờ xác nhận")
const LOG_TITLE_BY_CODE = {
  1: "Chờ xác nhận",
  2: "Đã xác nhận",
  3: "Đang chuẩn bị hàng",
  4: "Chuẩn bị giao hàng",
  5: "Đang giao hàng",
  6: "Hoàn thành",
  7: "Hủy đơn",
};

const getStepVisual = (state) => {
  // state: DONE | CURRENT | UPCOMING | CANCELLED
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

const OrderDetailComponent = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [order, setOrder] = useState(null);
  const [timeline, setTimeline] = useState(null);

  const fetchDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getOrderDetail(id);
      const data = unwrapApi(res);
      setOrder(data);
    } catch (err) {
      console.error("Lỗi load chi tiết đơn hàng:", err);
      message.error("Không tải được chi tiết đơn hàng");
    } finally {
      setLoading(false);
    }
  };

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

  // ===== derived hooks =====
  const isOnline = normalizeLoaiDon(order?.loaiDon) === "ONLINE";

  const mustPay = useMemo(() => Number(order?.tongTienThuHo || 0), [order?.tongTienThuHo]);

  const totalPaid = useMemo(() => {
    if (!Array.isArray(order?.payments)) return 0;
    return order.payments.reduce((sum, p) => sum + Number(p.soTien || 0), 0);
  }, [order?.payments]);

  const paidByBE = order?.trangThaiThanhToan === 1;
  const isPaid = useMemo(() => paidByBE || (mustPay > 0 && totalPaid >= mustPay), [paidByBE, mustPay, totalPaid]);

  const paymentPercent = useMemo(() => {
    if (mustPay <= 0) return 0;
    return Math.min(100, Math.round((totalPaid * 100) / mustPay));
  }, [mustPay, totalPaid]);

  const paymentStatusTag = useMemo(() => (isPaid ? <Tag color="green">Đã thanh toán</Tag> : <Tag color="orange">Chưa thanh toán</Tag>), [isPaid]);

  const orderStatusInfo = useMemo(() => getOrderStatusInfo(order), [order]);

  const tongSanPham = useMemo(() => order?.items?.length || 0, [order?.items]);

  const currentStatus = useMemo(() => {
    const st = timeline?.trangThai ?? order?.trangThai ?? 1;
    return Number(st);
  }, [timeline?.trangThai, order?.trangThai]);

  // ✅ label “Xác nhận hoàn thành đơn hàng”
  const nextStatus = useMemo(() => {
    switch (currentStatus) {
      case 1:
        return { code: 2, label: "Xác nhận đơn hàng" };
      case 2:
        return { code: 3, label: "Chuyển sang chuẩn bị hàng" };
      case 3:
        return { code: 4, label: "Chuyển sang chuẩn bị giao hàng" };
      case 4:
        return { code: 5, label: "Chuyển sang đang giao hàng" };
      case 5:
        return { code: 6, label: "Xác nhận hoàn thành đơn hàng" };
      default:
        return null;
    }
  }, [currentStatus]);

  const canCancel = useMemo(() => isOnline && currentStatus !== 6 && currentStatus !== 7, [isOnline, currentStatus]);

  // ✅ bỏ “Tạo đơn” -> chỉ còn 6 bước (1..6)
  const timelineTotalSteps = 6;

  const completedSteps = useMemo(() => {
    if (!isOnline) return 0;
    if (currentStatus === 7) return 1; // hủy: coi như đạt bước 1 tối thiểu
    return Math.min(timelineTotalSteps, Math.max(1, currentStatus));
  }, [isOnline, currentStatus]);

  const timelinePercent = useMemo(() => {
    if (!isOnline) return 0;
    return Math.round((completedSteps * 100) / timelineTotalSteps);
  }, [isOnline, completedSteps]);

  // ===== Actions =====
  const handleUpdateStatus = async (newStatus, note) => {
    if (!id) return;
    try {
      await updateOrderStatus(id, { newStatus, note: note || "" });
      message.success("Cập nhật trạng thái thành công");
      await refreshAll();
    } catch (err) {
      const beMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message || "Cập nhật thất bại";
      message.error(beMsg);
      console.error(err);
    }
  };

  const confirmNext = () => {
    if (!nextStatus) return;
    Modal.confirm({
      title: "Xác nhận cập nhật trạng thái?",
      content: (
        <div>
          Bạn muốn chuyển trạng thái sang: <b>{ORDER_STATUS_ONLINE_MAP[nextStatus.code]?.text || nextStatus.code}</b>
          <div style={{ marginTop: 6, color: "#64748b" }}>Hành động này sẽ được ghi log lịch sử đơn hàng.</div>
        </div>
      ),
      okText: "Xác nhận",
      cancelText: "Hủy",
      onOk: () => handleUpdateStatus(nextStatus.code),
    });
  };

  const confirmCancel = () => {
    Modal.confirm({
      title: "Xác nhận hủy đơn hàng?",
      content: "Sau khi hủy, đơn online sẽ không thể tiếp tục luồng xử lý.",
      okText: "Hủy đơn",
      okButtonProps: { danger: true },
      cancelText: "Không",
      onOk: () => handleUpdateStatus(7, "Hủy bởi nhân viên"),
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

  const paymentColumns = [
    { title: "Phương thức", dataIndex: "tenHinhThuc", key: "tenHinhThuc" },
    { title: "Khách đưa", dataIndex: "khachDua", key: "khachDua", align: "right", render: (v) => formatCurrency(v) },
    { title: "Số tiền thanh toán", dataIndex: "soTien", key: "soTien", align: "right", render: (v) => <Text strong>{formatCurrency(v)}</Text> },
    { title: "Tiền trả lại", dataIndex: "tienTraLai", key: "tienTraLai", align: "right", render: (v) => formatCurrency(v) },
  ];

  // ===== Render timeline =====
  const renderTimeline = () => {
    if (!isOnline) {
      return (
        <Card size="small" style={{ borderRadius: 12, borderColor: "#edf2ff" }}>
          <Text type="secondary">
            Timeline hiện chỉ áp dụng cho <b>đơn ONLINE</b>.
          </Text>
        </Card>
      );
    }

    const steps = timeline?.steps || [];
    const logs = timeline?.logs || [];

    if (loadingTimeline && !timeline) {
      return (
        <div style={{ padding: 16 }}>
          <Spin />
        </div>
      );
    }

    // ✅ Với yêu cầu “1 đơn chỉ có 1 actionlog”:
    // - chỉ step hiện tại mới có time/by
    // - các step khác để "-"
    const findLogByCode = (code) => {
      if (!Array.isArray(logs) || logs.length === 0) return null;

      // Nếu chỉ có 1 log -> gán cho step currentStatus
      if (logs.length === 1) {
        return code === currentStatus ? logs[0] : null;
      }

      // fallback (nếu sau này bạn cho nhiều log)
      const expectedTitle = LOG_TITLE_BY_CODE[code];
      if (!expectedTitle) return null;
      const hit = logs.find((l) => (l?.title || "").trim() === expectedTitle);
      return hit || null;
    };

    return (
      <div>
        <Card size="small" style={{ borderRadius: 12, borderColor: "#edf2ff" }} bodyStyle={{ padding: 14 }}>
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
            {/* ✅ bỏ “Tạo đơn hàng” - step đầu là “Chờ xác nhận” */}
            {steps.map((s) => {
              const visual = getStepVisual(s.state);
              const isCurrent = s.state === "CURRENT";
              const isDone = s.state === "DONE";
              const isUpcoming = s.state === "UPCOMING";
              const isCancelled = s.state === "CANCELLED";

              const titlePrefix = isCurrent ? "Hiện tại:" : isDone ? "Đã xong:" : isUpcoming ? "Sắp tới:" : "Trạng thái:";

              const matchedLog = findLogByCode(s.code);
              const timeLabel = matchedLog?.at ? formatDateTime(matchedLog.at) : "-";

              return (
                <Timeline.Item key={s.code} color={visual.color} dot={visual.dot} label={timeLabel}>
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
                        <Tag color={ORDER_STATUS_ONLINE_MAP[s.code]?.color || "default"}>{s.name}</Tag>
                        <Text strong>
                          {titlePrefix} {s.name}
                        </Text>

                        {/* ✅ current step: nếu là 6 thì hiện Hoàn tất */}
                        {isCurrent && s.code === 6 && <Tag color="green">Hoàn tất</Tag>}
                        {isCurrent && s.code === 7 && <Tag color="red">Đã hủy</Tag>}
                        {isCurrent && s.code !== 6 && s.code !== 7 && <Tag color="blue">Đang xử lý</Tag>}

                        {isDone && <Tag color="green">Hoàn tất</Tag>}
                        {isCancelled && <Tag color="red">Đã hủy</Tag>}
                      </Space>

                      <Text type="secondary">{STEP_DESC_BY_STATUS[s.code] || "Cập nhật trạng thái đơn hàng."}</Text>

                      <Text type="secondary">
                        Bởi: <b>{matchedLog?.by || "Hệ thống"}</b>
                      </Text>
                    </Space>
                  </Card>
                </Timeline.Item>
              );
            })}
          </Timeline>

          <Divider style={{ margin: "12px 0" }} />

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <Button type="primary" disabled={!nextStatus || currentStatus === 6 || currentStatus === 7} onClick={confirmNext}>
              {nextStatus?.label || "Xác nhận"}
            </Button>

            <Button danger disabled={!canCancel} onClick={confirmCancel}>
              Hủy đơn hàng
            </Button>
          </div>
        </Card>

        {/* Logs detail */}
        <Card size="small" title="Lịch sử thay đổi (OrderActionLog)" style={{ marginTop: 16, borderRadius: 12, borderColor: "#edf2ff" }}>
          {Array.isArray(logs) && logs.length > 0 ? (
            <Timeline>
              {logs.map((l, idx) => (
                <Timeline.Item key={idx}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div>
                      <Text strong>{l.title || "Cập nhật"}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">{l.description || "-"}</Text>
                      </div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary">
                          Bởi: <b>{l.by || "Hệ thống"}</b>
                        </Text>
                      </div>
                    </div>
                    <Text type="secondary">{formatDateTime(l.at)}</Text>
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
          <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ paddingLeft: 0, marginBottom: 12 }}>
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
            <Button icon={<FileTextOutlined />}>Xem hóa đơn</Button>
            <Button icon={<PrinterOutlined />}>In hóa đơn</Button>
            <Button icon={<ReloadOutlined />} onClick={refreshAll} loading={loading || loadingTimeline}>
              Làm mới
            </Button>
          </Space>
        </div>

        {/* MAIN CARD + TABS */}
        <Card style={{ borderRadius: 16, boxShadow: "0 8px 20px rgba(15,23,42,0.04)", border: "1px solid #edf2ff" }} bodyStyle={{ paddingTop: 12 }}>
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
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span>Giảm giá voucher:</span>
                      <span style={{ color: "#f11e1eff" }}>- {formatCurrency(order?.giaTriGiamGia)}</span>
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
                  <Card size="small" title="Trạng thái thanh toán" extra={paymentStatusTag} style={{ borderRadius: 12, borderColor: "#edf2ff" }}>
                    <p style={{ marginBottom: 8 }}>{isPaid ? "Đơn hàng đã được thanh toán đầy đủ" : "Đơn hàng chưa thanh toán đủ"}</p>
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
                <Table rowKey="id" columns={paymentColumns} dataSource={order?.payments || []} pagination={false} />
              </Card>
            </Tabs.TabPane>

            <Tabs.TabPane tab="Trạng thái" key="status">
              {renderTimeline()}
            </Tabs.TabPane>

            <Tabs.TabPane tab="Lịch sử thay đổi" key="history">
              <Card size="small" style={{ borderRadius: 12, borderColor: "#edf2ff" }}>
                <Text type="secondary">
                  Bạn có thể xem lịch sử chi tiết ngay trong tab <b>Trạng thái</b> (OrderActionLog).
                </Text>
              </Card>
            </Tabs.TabPane>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default OrderDetailComponent;
